import { Artifact, CompilerInput } from 'hardhat/types';
import { ARTIFACT_FORMAT_VERSION } from 'hardhat/internal/constants';
import { CompiledOutput, ResolcConfig, SolcConfigData } from './types';
import { COMPILER_RESOLC_NEED_EVM_CODEGEN } from './constants';
import chalk from 'chalk';
import { ResolcPluginError } from './errors';

export function getArtifactFromContractOutput(sourceName: string, contractName: string, contractOutput: any): Artifact {
    const evmBytecode = contractOutput.evm?.bytecode;
    let bytecode: string = evmBytecode?.object ?? '';

    const evmDeployedBytecode = contractOutput.evm?.deployedBytecode;
    let deployedBytecode: string = evmDeployedBytecode?.object ?? '';

    const linkReferences = evmBytecode?.linkReferences ?? {};
    const deployedLinkReferences = evmDeployedBytecode?.linkReferences ?? {};

    return {
        _format: ARTIFACT_FORMAT_VERSION,
        contractName,
        sourceName,
        abi: contractOutput.abi,
        bytecode,
        deployedBytecode,
        linkReferences,
        deployedLinkReferences,
    };
}

export function getVersionComponents(version: string): number[] {
    const versionComponents = version.split('.');
    return [parseInt(versionComponents[0], 10), parseInt(versionComponents[1], 10), parseInt(versionComponents[2], 10)];
}

export function updateDefaultCompilerConfig(solcConfigData: SolcConfigData, resolc: ResolcConfig) {
    const compiler = solcConfigData.compiler;

    const settings = compiler.settings || {};

    compiler.settings = {
        ...settings,
        optimizer: { ...resolc.settings?.optimizer },
        evmVersion: resolc.settings?.evmVersion,
    };

    const forceEVMLA = resolc.settings?.forceEVMLA && resolc.compilerSource === 'binary';
    resolc.settings!.forceEVMLA = forceEVMLA;

    const [major, minor] = getVersionComponents(compiler.version);
    if (major === 0 && minor < 7 && resolc.compilerSource === 'binary') {
        console.warn(chalk.blue(COMPILER_RESOLC_NEED_EVM_CODEGEN));
        compiler.settings.forceEVMLA = true;
    }

    delete compiler.settings.metadata;
}

export function pluralize(n: number, singular: string, plural?: string) {
    if (n === 1) {
        return singular;
    }

    if (plural !== undefined) {
        return plural;
    }

    return `${singular}s`;
}

function extractYulCommands(config: ResolcConfig, commandArgs: string[]): string[] {
    const settings = config.settings!;

    commandArgs.push(`--yul`);

    if (settings.solcPath) {
        commandArgs.push(`--solc=${settings.solcPath}`);
    }

    if (settings.optimizer?.enabled) {
        commandArgs.push(`--optimization=${settings.optimizer.parameters || '3'}`);
    }

    if (settings.llvmVerifyEach) {
        commandArgs.push(`--llvm-verify-each`);
    }

    if (settings.llvmDebugLogging) {
        commandArgs.push(`--llvm-debug-logging`);
    }

    if (settings.metadataHash) {
        if (settings.metadataHash !== 'none') {
            throw new ResolcPluginError(`--metadata-hash only supported value is 'none'.`);
        }
        commandArgs.push(`--metadata-hash=${settings.metadataHash}`);
    }

    if (settings.debugOutputDir) {
        commandArgs.push(`--debug-output-dir=${settings.debugOutputDir}`);
    }

    if (settings.emitDourceDebugInfo) {
        commandArgs.push(`-g`);
    }

    if (settings.asm) {
        commandArgs.push(`--asm`);
    }

    if (settings.bin) {
        commandArgs.push(`--bin`);
    }

    if (settings.outputDir) {
        commandArgs.push(`--output-dir=${settings.outputDir}`);
    }

    return commandArgs;
}

function extractLlvmIRCommands(config: ResolcConfig, commandArgs: string[]): string[] {
    const settings = config.settings!;

    commandArgs.push(`--llvm-ir`);

    if (settings.optimizer?.enabled) {
        commandArgs.push(`--optimization=${settings.optimizer.parameters || '3'}`);
    }

    if (settings.llvmVerifyEach) {
        commandArgs.push(`--llvm-verify-each`);
    }

    if (settings.llvmDebugLogging) {
        commandArgs.push(`--llvm-debug-logging`);
    }

    if (settings.metadataHash) {
        if (settings.metadataHash !== 'none') {
            throw new ResolcPluginError(`--metadata-hash only supported value is 'none'.`);
        }
        commandArgs.push(`--metadata-hash=${settings.metadataHash}`);
    }

    if (settings.debugOutputDir) {
        commandArgs.push(`--debug-output-dir=${settings.debugOutputDir}`);
    }

    if (settings.emitDourceDebugInfo) {
        commandArgs.push(`-g`);
    }

    if (settings.asm) {
        commandArgs.push(`--asm`);
    }

    if (settings.bin) {
        commandArgs.push(`--bin`);
    }

    if (settings.outputDir) {
        commandArgs.push(`--output-dir=${settings.outputDir}`);
    }

    return commandArgs;
}

function extractStandardJSONCommands(config: ResolcConfig, commandArgs: string[]): string[] {
    const settings = config.settings!;

    commandArgs.push(`--standard-json`);

    if (settings.solcPath) {
        commandArgs.push(`--solc=${settings.solcPath}`);
    }

    if (settings.detectMissingLibraries) {
        commandArgs.push(`--detect-missing-libraries`);
    }

    if (settings.forceEVMLA) {
        commandArgs.push(`--force-evmla`);
    }

    if (settings.basePath) {
        commandArgs.push(`--base-path=${settings.basePath}`);
    }

    if (settings.includePaths) {
        commandArgs.push(`--include-paths=${settings.includePaths}`);
    }

    if (settings.allowPaths) {
        if (!settings.basePath) {
            throw new ResolcPluginError(
                `--allow-paths option is only available when --base-path has a non-empty value.`,
            );
        }
        commandArgs.push(`--allow-paths=${settings.allowPaths}`);
    }

    if (settings.debugOutputDir) {
        commandArgs.push(`--debug-output-dir=${settings.debugOutputDir}`);
    }

    if (settings.emitDourceDebugInfo) {
        commandArgs.push(`-g`);
    }

    if (settings.asm) {
        commandArgs.push(`--asm`);
    }

    if (settings.bin) {
        commandArgs.push(`--bin`);
    }

    if (settings.outputDir) {
        commandArgs.push(`--output-dir=${settings.outputDir}`);
    }

    return commandArgs;
}

function extractCombinedJSONCommands(config: ResolcConfig, commandArgs: string[]): string[] {
    const settings = config.settings!;

    commandArgs.push(`--combined-json=${settings.combinedJson}`);

    if (settings.libraries) {
        commandArgs.push(`-l=${settings.libraries}`);
    }

    if (settings.solcPath) {
        commandArgs.push(`--solc=${settings.solcPath}`);
    }

    if (settings.evmVersion) {
        commandArgs.push(`--evm-version=${settings.evmVersion}`);
    }

    if (settings.disableSolcOptimizer) {
        commandArgs.push(`--disable-solc-optimizer`);
    }

    if (settings.optimizer?.enabled) {
        commandArgs.push(`--optimization=${settings.optimizer.parameters || '3'}`);
    }

    if (settings.forceEVMLA) {
        commandArgs.push(`--force-evmla`);
    }

    if (settings.metadataHash) {
        if (settings.metadataHash !== 'none') {
            throw new ResolcPluginError(`--metadata-hash only supported value is 'none'.`);
        }
        commandArgs.push(`--metadata-hash=${settings.metadataHash}`);
    }

    if (settings.basePath) {
        commandArgs.push(`--base-path=${settings.basePath}`);
    }

    if (settings.includePaths) {
        commandArgs.push(`--include-paths=${settings.includePaths}`);
    }

    if (settings.allowPaths) {
        if (!settings.basePath) {
            throw new ResolcPluginError(
                `--allow-paths option is only available when --base-path has a non-empty value.`,
            );
        }
        commandArgs.push(`--allow-paths=${settings.allowPaths}`);
    }

    if (settings.suppressWarnings) {
        commandArgs.push(`--suppress-warnings=${settings.suppressWarnings.join(' ')}`);
    }

    if (settings.debugOutputDir) {
        commandArgs.push(`--debug-output-dir=${settings.debugOutputDir}`);
    }

    if (settings.emitDourceDebugInfo) {
        commandArgs.push(`-g`);
    }

    if (settings.overwrite) {
        commandArgs.push(`--overwrite`);
    }

    if (settings.asm) {
        commandArgs.push(`--asm`);
    }

    if (settings.bin) {
        commandArgs.push(`--bin`);
    }

    if (settings.outputDir) {
        commandArgs.push(`--output-dir=${settings.outputDir}`);
    }

    return commandArgs;
}

function extractRemainingCommands(config: ResolcConfig, commandArgs: string[]): string[] {
    const settings = config.settings!;

    if (settings.libraries) {
        commandArgs.push(`-l=${settings.libraries}`);
    }

    if (settings.solcPath) {
        commandArgs.push(`--solc=${settings.solcPath}`);
    }

    if (settings.evmVersion) {
        commandArgs.push(`--evm-version=${settings.evmVersion}`);
    }

    if (settings.disableSolcOptimizer) {
        commandArgs.push(`--disable-solc-optimizer`);
    }

    if (settings.optimizer?.enabled) {
        commandArgs.push(`--optimization=${settings.optimizer.parameters || '3'}`);
    }

    if (settings.forceEVMLA) {
        commandArgs.push(`--force-evmla`);
    }

    if (settings.metadataHash) {
        if (settings.metadataHash !== 'none') {
            throw new ResolcPluginError(`--metadata-hash only supported value is 'none'.`);
        }
        commandArgs.push(`--metadata-hash=${settings.metadataHash}`);
    }

    if (settings.basePath) {
        commandArgs.push(`--base-path=${settings.basePath}`);
    }

    if (settings.includePaths) {
        commandArgs.push(`--include-paths=${settings.includePaths}`);
    }

    if (settings.allowPaths) {
        if (!settings.basePath) {
            throw new ResolcPluginError(
                `--allow-paths option is only available when --base-path has a non-empty value.`,
            );
        }
        commandArgs.push(`--allow-paths=${settings.allowPaths}`);
    }

    if (settings.suppressWarnings) {
        commandArgs.push(`--suppress-warnings=${settings.suppressWarnings.join(' ')}`);
    }

    if (settings.debugOutputDir) {
        commandArgs.push(`--debug-output-dir=${settings.debugOutputDir}`);
    }

    if (settings.emitDourceDebugInfo) {
        commandArgs.push(`-g`);
    }

    if (settings.asm) {
        commandArgs.push(`--asm`);
    }

    if (settings.bin) {
        commandArgs.push(`--bin`);
    }

    if (settings.outputDir) {
        commandArgs.push(`--output-dir=${settings.outputDir}`);
    }

    return commandArgs;
}

export function extractCommands(config: ResolcConfig): string[] {
    const commandArgs: string[] = [];

    if (config.settings?.yul) {
        return extractYulCommands(config, commandArgs);
    } else if (config.settings?.llvmIR) {
        return extractLlvmIRCommands(config, commandArgs);
    } else if (config.settings?.standardJson) {
        return extractStandardJSONCommands(config, commandArgs);
    } else if (config.settings?.combinedJson) {
        return extractCombinedJSONCommands(config, commandArgs);
    } else {
        return extractRemainingCommands(config, commandArgs);
    }
}

export function extractImports(fileContent: string): string[] {
    const importRegex = /import\s+(?:"([^"]+)"|'([^']+)'|(?:[^'"]+)\s+from\s+(?:"([^"]+)"|'([^']+)'))\s*;/g;
    let imports: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = importRegex.exec(fileContent)) !== null) {
        const importedPath = match[1] || match[2] || match[3] || match[4];
        if (importedPath) {
            imports.push(importedPath);
        }
    }
    return imports;
}

export function mapImports(input: CompilerInput): Map<string, string[]> {
    const keys = Object.keys(input.sources);
    const map = new Map<string, string[]>();
    for (let key of keys) {
        const importArray = extractImports(input.sources[key].content);
        map.set(key, importArray);
    }
    return map;
}

export function orderSources(mapped: Map<string, string[]>): string[] {
    let ordered: string[] = [];

    mapped.forEach((values, key) => {
        for (let value of values) {
            if (ordered.includes(value)) continue;

            ordered.push(value);
        }

        if (ordered.includes(key)) return;

        ordered.push(key);
    });

    return ordered;
}

export function deepUpdate(a: CompiledOutput, b: CompiledOutput): CompiledOutput {
    const keys = Object.keys(b.sources);
    const lastId = Object.keys(a.sources).length - 1;
    let nextIds = lastId + Object.keys(b.sources).length;
    if (Object.keys(a.sources).length === 0) {
        return b;
    } else {
        keys.forEach((key) => {
            a.contracts = Object.assign({}, a.contracts, { [key]: b.contracts[key] });
            a.sources = Object.assign({}, a.sources, { [key]: { id: nextIds, ast: b.sources[key].ast } });
            nextIds++;
        });
    }
    return a;
}
