import type { CompilerInput, SolcConfig } from "hardhat/types"

type EvmVersions =
    | 'homestead'
    | 'tangerineWhistle'
    | 'spuriousDragon'
    | 'byzantium'
    | 'constantinople'
    | 'petersburg'
    | 'istanbul'
    | 'berlin'
    | 'london'
    | 'paris'
    | 'shanghai'
    | 'cancun';

type SuppresWarningsOpts =
    | 'ecrecover'
    | 'sendtransfer'
    | 'extcodesize'
    | 'txorigin'
    | 'blocktimestamp'
    | 'blocknumber'
    | 'blockhash';

export interface ResolcConfig {
    version: string;
    compilerSource?: 'binary' | 'npm';

    settings?: {
        // Set the given path as the root of the source tree instead of the root of the filesystem. Passed to `solc` without changes.
        basePath?: string
        // Make an additional source directory available to the default import callback. Can be used multiple times. Can only be used if the base path has a non-empty value. Passed to `solc` without changes.
        includePaths?: string[]
        // Allow a given path for imports. A list of paths can be supplied by separating them with a comma. Passed to `solc` without changes.
        allowPaths?: string
        // Create one file per component and contract/file at the specified directory, if given.
        outputDir?: string
        // Optimizer settings.
        optimizer?: {
            // Enable the optimizer.
            enabled?: boolean
            // Set the optimization parameter. Use `3` for best performance and `z` for minimal size. Defaults to `3`
            parameters?: "0" | "1" | "2" | "3" | "s" | "z"
            // Try to recompile with -Oz if the bytecode is too large.
            fallbackOz?: boolean
        }
        // Specify the path to the `solc` executable.
        solcPath?: string
        // The EVM target version to generate IR for. See https://github.com/paritytech/revive/blob/main/crates/common/src/evm_version.rs for reference.
        evmVersion?: EvmVersions
        // Forcibly switch to EVM legacy assembly pipeline. It is useful for older revisions of `solc` 0.8, where Yul was considered highly experimental and contained more bugs than today
        forceEVMLA?: boolean
        // Suppress specified warnings.
        suppressWarnings?: SuppresWarningsOpts[]
        // Dump all IRs to files in the specified directory. Only for testing and debugging.
        debugOutputDir?: string
        // If compilerSource == "npm", this option is ignored.
        compilerPath?: string
        // Specific contracts present in source to be compiled
        contractsToCompile?: string[]
        // Generate source based debug information in the output code file. This only has an effect with the LLVM-IR code generator and is ignored otherwise.
        emitDourceDebugInfo?: boolean
        // Disable the `solc` optimizer.
        disableSolcOptimizer?: boolean
        // Compile in batches. Useful for environmnents with limited resources and large number of files.
        batchSize?: number
    }
}

export interface ReviveCompilerInput extends CompilerInput {
    // Suppress specified warnings. Currently supported: txorigin, sendtransfer
    suppressedWarnings?: string[]
    // Suppress specified errors. Currently supported: txorigin, sendtransfer
    suppressedErrors?: string[]
}

export interface MissingLibrary {
    contractName: string
    contractPath: string
    missingLibraries: string[]
}

export interface SolcConfigData {
    compiler: SolcConfig
    file?: string
}

export interface ContractBatch {
    [key: string]: object | string
}

export interface ContractSource {
    [key: string]: object
}

export interface Sources {
    [key: string]: {
        id: number;
        ast: object;
    };
}

export interface CompiledOutput {
    contracts: ContractSource;
    sources: Sources;
    errors: string[];
    version: string;
    long_version: string;
    revive_version: string;
}
