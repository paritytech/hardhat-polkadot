import type { HookContext } from "hardhat/types/hooks"
import type { SolcConfig } from "hardhat/types/config"
import type { CompilerInput, CompilerOutput, Compiler } from "hardhat/types/solidity"
import debug from "debug"
import chalk from "chalk"
import { assertHardhatInvariant } from "@nomicfoundation/hardhat-errors"
import { getCacheDir } from "@nomicfoundation/hardhat-utils/global-dir"

import { compile } from "../compile/index.js"
import { ResolcCompilerDownloader } from "../downloader.js"
import { ResolcPluginError } from "../errors.js"
import { RESOLC_VERSION_LATEST } from "../constants.js"
import { getVersionComponents, pluralize } from "../utils.js"
import type { CompilerPlatform, ResolcBuild, ResolcConfig } from "../types.js"

const logDebug = debug("hardhat:core:tasks:compile")

/**
 * Download (if needed) and return the resolc compiler build.
 * Falls back to WASM if the native binary doesn't work.
 */
async function getResolcBuild(resolcConfig: ResolcConfig): Promise<ResolcBuild> {
    let resolcVersion = resolcConfig.version

    // Resolve "latest" to an actual version number
    if (resolcVersion === RESOLC_VERSION_LATEST) {
        const nativePlatform = ResolcCompilerDownloader.getCompilerPlatform()
        const compilersCache = await getCacheDir()
        const downloader = ResolcCompilerDownloader.getConcurrencySafeDownloader(
            nativePlatform,
            compilersCache,
        )
        resolcVersion = await downloader.getLatestVersion()
    }
    const compilersCache = await getCacheDir()

    const downloadAndGet = async (
        platform: CompilerPlatform,
    ): Promise<ResolcBuild | undefined> => {
        const downloader = ResolcCompilerDownloader.getConcurrencySafeDownloader(
            platform,
            compilersCache,
        )

        await downloader.downloadCompiler(
            resolcVersion,
            async (isDownloaded: boolean) => {
                if (!isDownloaded) {
                    console.log(`Downloading resolc compiler ${resolcVersion}`)
                }
            },
            async () => {},
        )

        return downloader.getCompiler(resolcVersion)
    }

    // If user specified a custom resolc path, use it directly
    if (resolcConfig.settings?.resolcPath) {
        return {
            resolcPath: resolcConfig.settings.resolcPath,
            version: resolcVersion,
            longVersion: resolcVersion,
            isJs: false,
        }
    }

    const nativePlatform = ResolcCompilerDownloader.getCompilerPlatform()
    const compiler = await downloadAndGet(nativePlatform)

    if (compiler !== undefined) {
        return compiler
    }

    logDebug(
        "Native resolc binary doesn't work, using wasm instead. Try running npx hardhat clean --global",
    )

    const { CompilerPlatform: CP } = await import("../types.js")
    const wasmCompiler = await downloadAndGet(CP.WASM)

    assertHardhatInvariant(
        wasmCompiler !== undefined,
        `WASM build of resolc ${resolcVersion} isn't working`,
    )

    return wasmCompiler
}

/**
 * Normalize the compiler output to be compatible with @openzeppelin/hardhat-upgrades.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCompilerOutput(compOut: any): CompilerOutput {
    if (!compOut.contracts) return compOut

    const result = { ...compOut, contracts: { ...compOut.contracts } }
    for (const file of Object.keys(result.contracts)) {
        result.contracts[file] = { ...result.contracts[file] }
        for (const contract of Object.keys(result.contracts[file])) {
            const original = result.contracts[file][contract]
            const bytecode = original.evm?.bytecode?.object ?? ""
            if (original.evm) {
                result.contracts[file][contract] = {
                    ...original,
                    evm: {
                        ...original.evm,
                        bytecode: {
                            functionDebugData: {},
                            generatedSources: [],
                            linkReferences: {},
                            object: bytecode,
                            opcodes: "",
                            sourceMap: "",
                        },
                    },
                }
            }
        }
    }
    return result
}

// SolidityHooks is augmented onto HardhatHooks by the solidity builtin plugin.
// Not re-exported from a public path; duplicated here. Keep in sync with
// hardhat/src/internal/builtin-plugins/solidity/type-extensions/hooks.ts
interface SolidityHooks {
    invokeSolc: (
        context: HookContext,
        compiler: Compiler,
        solcInput: CompilerInput,
        solcConfig: SolcConfig,
        next: (
            nextContext: HookContext,
            nextCompiler: Compiler,
            nextSolcInput: CompilerInput,
            nextSolcConfig: SolcConfig,
        ) => Promise<CompilerOutput>,
    ) => Promise<CompilerOutput>
    preprocessSolcInputBeforeBuilding: (
        context: HookContext,
        solcInput: CompilerInput,
        next: (nextContext: HookContext, nextSolcInput: CompilerInput) => Promise<CompilerInput>,
    ) => Promise<CompilerInput>
}

const solidityHookHandler: () => Promise<Partial<SolidityHooks>> = async () => ({
    invokeSolc: async (context, compiler, solcInput, solcConfig, next) => {
        const resolcConfig: ResolcConfig | undefined = context.config.resolc
        if (!resolcConfig) {
            return next(context, compiler, solcInput, solcConfig)
        }

        // Validate solidity version
        const [major, minor] = getVersionComponents(solcConfig.version)
        if (major === 0 && minor < 8) {
            throw new ResolcPluginError(
                `Solidity versions below 0.8.0 are not supported. Trying to use ${solcConfig.version}`,
            )
        }

        const resolcBuild = await getResolcBuild(resolcConfig)

        const count = Object.keys(solcInput.sources).length
        if (count > 0) {
            console.info(chalk.yellow(`Compiling ${count} Solidity ${pluralize(count, "file")}`))
        }

        const config: ResolcConfig = {
            ...resolcConfig,
            settings: {
                resolcPath: resolcBuild.resolcPath,
                solcPath: compiler.compilerPath,
                ...resolcConfig.settings,
            },
        }

        const compOut = await compile(config, solcInput)
        const output = normalizeCompilerOutput(compOut)

        // Embed resolc metadata in the output so it appears in build-info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(output as any).resolc = {
            version: resolcBuild.version,
            longVersion: resolcBuild.longVersion,
            isWasm: resolcBuild.isJs,
            resolcPath: resolcBuild.resolcPath,
            solcVersion: solcConfig.version,
            solcPath: compiler.compilerPath,
            optimizer: resolcConfig.settings?.optimizer ?? null,
        }

        if (count > 0) {
            console.info(
                chalk.green(
                    `Successfully compiled ${count} Solidity ${pluralize(count, "file")}`,
                ),
            )
        }

        return output
    },

    preprocessSolcInputBeforeBuilding: async (context, solcInput, next) => {
        const resolcConfig: ResolcConfig | undefined = context.config.resolc
        if (!resolcConfig) {
            return next(context, solcInput)
        }

        // Set output selection to include what resolc needs
        solcInput.settings.outputSelection = {
            "*": {
                "*": [
                    "abi",
                    "metadata",
                    "evm.bytecode",
                    "evm.deployedBytecode",
                    "evm.methodIdentifiers",
                    "storageLayout",
                ],
                "": ["ast"],
            },
        }

        return next(context, solcInput)
    },
})

export default solidityHookHandler
