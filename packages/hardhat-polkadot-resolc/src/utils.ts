import type { Artifact, CompilerInput } from "hardhat/types"
import { ARTIFACT_FORMAT_VERSION } from "hardhat/internal/constants"
import chalk from "chalk"
import { updateSolc } from "./compile/npm"
import type { ResolcConfig, SolcConfigData } from "./types"
import { COMPILER_RESOLC_NEED_EVM_CODEGEN } from "./constants"
import { ResolcPluginError } from "./errors"

export function getArtifactFromContractOutput(
    sourceName: string,
    contractName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contractOutput: any,
): Artifact {
    const evmBytecode = contractOutput.evm?.bytecode
    const bytecode: string = evmBytecode?.object ?? ""

    const evmDeployedBytecode = contractOutput.evm?.deployedBytecode
    const deployedBytecode: string = evmDeployedBytecode?.object ?? ""

    const linkReferences = evmBytecode?.linkReferences ?? {}
    const deployedLinkReferences = evmDeployedBytecode?.linkReferences ?? {}

    return {
        _format: ARTIFACT_FORMAT_VERSION,
        contractName,
        sourceName,
        abi: contractOutput.abi,
        bytecode,
        deployedBytecode,
        linkReferences,
        deployedLinkReferences,
    }
}

export function getVersionComponents(version: string): number[] {
    const versionComponents = version.split(".")
    return [
        parseInt(versionComponents[0], 10),
        parseInt(versionComponents[1], 10),
        parseInt(versionComponents[2], 10),
    ]
}

export function updateDefaultCompilerConfig(solcConfigData: SolcConfigData, resolc: ResolcConfig) {
    const compiler = solcConfigData.compiler

    const settings = compiler.settings || {}

    let optimizer = {}

    if (resolc.settings?.optimizer && resolc.settings?.optimizer?.enabled) {
        optimizer = Object.assign({}, resolc.settings?.optimizer)
    } else if (resolc.settings?.optimizer?.enabled === false) {
        optimizer = Object.assign({}, { enabled: false, runs: 200 })
    } else {
        optimizer = Object.assign({}, { enabled: false, runs: 200 })
    }

    compiler.settings = {
        ...settings,
        optimizer: { ...optimizer },
        evmVersion: resolc.settings?.evmVersion || compiler.settings.evmVersion,
    }

    const forceEVMLA = resolc.settings?.forceEVMLA && resolc.compilerSource === "binary"
    resolc.settings!.forceEVMLA = forceEVMLA

    const [major, minor] = getVersionComponents(compiler.version)
    if (major === 0 && minor < 7 && resolc.compilerSource === "binary") {
        console.warn(chalk.blue(COMPILER_RESOLC_NEED_EVM_CODEGEN))
        compiler.settings.forceEVMLA = true
    }

    if (resolc.compilerSource === "npm") {
        updateSolc(compiler.version)
    }

    delete compiler.settings.metadata
}

export function pluralize(n: number, singular: string, plural?: string) {
    if (n === 1) {
        return singular
    }

    if (plural !== undefined) {
        return plural
    }

    return `${singular}s`
}

function extractStandardJSONCommands(config: ResolcConfig, commandArgs: string[]): string[] {
    const settings = config.settings!

    commandArgs.push(`--standard-json`)

    if (settings.solcPath) {
        commandArgs.push(`--solc=${settings.solcPath}`)
    }

    if (settings.forceEVMLA) {
        commandArgs.push(`--force-evmla`)
    }

    if (settings.basePath) {
        commandArgs.push(`--base-path=${settings.basePath}`)
    }

    if (settings.includePaths) {
        commandArgs.push(`--include-paths=${settings.includePaths}`)
    }

    if (settings.allowPaths) {
        if (!settings.basePath) {
            throw new ResolcPluginError(
                `--allow-paths option is only available when --base-path has a non-empty value.`,
            )
        }
        commandArgs.push(`--allow-paths=${settings.allowPaths}`)
    }

    if (settings.debugOutputDir) {
        commandArgs.push(`--debug-output-dir=${settings.debugOutputDir}`)
    }

    if (settings.emitDourceDebugInfo) {
        commandArgs.push(`-g`)
    }

    if (settings.outputDir) {
        commandArgs.push(`--output-dir=${settings.outputDir}`)
    }

    if (settings.disableSolcOptimizer) {
        commandArgs.push(`--disable-solc-optimizer`)
    }

    return commandArgs
}

export function extractCommands(config: ResolcConfig): string[] {
    const commandArgs: string[] = []

    return extractStandardJSONCommands(config, commandArgs)
}

export function extractImports(fileContent: string): string[] {
    const importRegex =
        /import\s+(?:"([^"]+)"|'([^']+)'|(?:[^'"]+)\s+from\s+(?:"([^"]+)"|'([^']+)'))\s*;/g
    const imports: string[] = []
    let match: RegExpExecArray | null

    while ((match = importRegex.exec(fileContent)) !== null) {
        const importedPath = match[1] || match[2] || match[3] || match[4]
        if (importedPath) {
            imports.push(importedPath)
        }
    }
    return imports
}

export function mapImports(input: CompilerInput): Map<string, string[]> {
    const keys = Object.keys(input.sources)
    const map = new Map<string, string[]>()
    for (const key of keys) {
        const importArray = extractImports(input.sources[key].content)
        map.set(key, importArray)
    }
    return map
}

export function orderSources(mapped: Map<string, string[]>): string[] {
    const ordered: string[] = []

    mapped.forEach((values, key) => {
        for (const value of values) {
            if (ordered.includes(value)) continue

            ordered.push(value)
        }

        if (ordered.includes(key)) return

        ordered.push(key)
    })

    return ordered
}
