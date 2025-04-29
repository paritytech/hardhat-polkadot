import { CompilerInput, SolcConfig } from "hardhat/types"

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

type CombinedJSONOpts =
    | 'abi'
    | 'hashes'
    | 'metadata'
    | 'devdoc'
    | 'userdoc'
    | 'storage-layout'
    | 'ast'
    | 'asm'
    | 'bin'
    | 'bin-runtime';

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
        // Overwrite existing files (used together with -o).
        overwrite?: boolean
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
        // Output a single JSON document containing the specified information.
        combinedJson?: CombinedJSONOpts
        // Switch to standard JSON input/output mode. Read from stdin, write the result to stdout.
        standardJson?: boolean
        // Switch to missing deployable libraries detection mode. Only available for standard JSON input/output mode. Contracts are not compiled in this mode, and all compilation artifacts are not included.
        detectMissingLibraries?: boolean
        // Switch to Yul mode. Only one input Yul file is allowed. Cannot be used with combined and standard JSON modes.
        yul?: boolean
        // Switch to LLVM IR mode. Only one input LLVM IR file is allowed. Cannot be used with combined and standard JSON modes. Use this mode at your own risk, as LLVM IR input validation is not implemented.
        llvmIR?: boolean
        // Forcibly switch to EVM legacy assembly pipeline. It is useful for older revisions of `solc` 0.8, where Yul was considered highly experimental and contained more bugs than today
        forceEVMLA?: boolean
        // Set metadata hash mode. The only supported value is `none` that disables appending the metadata hash. Is enabled by default.
        metadataHash?: string
        // Output PolkaVM assembly of the contracts
        asm?: boolean
        // Output PolkaVM bytecode of the contracts
        bin?: boolean
        // Suppress specified warnings.
        suppressWarnings?: SuppresWarningsOpts[]
        // Dump all IRs to files in the specified directory. Only for testing and debugging.
        debugOutputDir?: string
        // Set the verify-each option in LLVM. Only for testing and debugging.
        llvmVerifyEach?: boolean
        // Set the debug-logging option in LLVM. Only for testing and debugging
        llvmDebugLogging?: boolean
        // If compilerSource == "npm", this option is ignored.
        compilerPath?: string
        // Specific contracts present in source to be compiled
        contractsToCompile?: string[]
        // Generate source based debug information in the output code file. This only has an effect with the LLVM-IR code generator and is ignored otherwise.
        emitDourceDebugInfo?: boolean
        // Specify addresses of deployable libraries. Syntax: `<libraryName>=<address> [, or whitespace] ...`.
        libraries?: string[]
        // Disable the `solc` optimizer.
        disableSolcOptimizer?: boolean
        // Try to recompile with -Oz if the bytecode is too large.
        fallbackToOptimizingForSize?: boolean
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
