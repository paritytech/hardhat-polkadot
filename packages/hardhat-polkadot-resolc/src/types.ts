import type { CompilerInput, SolcConfig } from "hardhat/types"
import { CompilerPlatform } from "hardhat/internal/solidity/compiler/downloader"

export interface ResolcConfig {
    version: string
    compilerSource?: "binary" | "npm"
    settings?: {
        // Set the given path as the root of the source tree instead of the root of the filesystem. Passed to `solc` without changes.
        basePath?: string
        // Make an additional source directory available to the default import callback. Can be used multiple times. Can only be used if the base path has a non-empty value. Passed to `solc` without changes.
        includePaths?: string[]
        // Allow a given path for imports. A list of paths can be supplied by separating them with a comma. Passed to `solc` without changes.
        allowPaths?: string
        // Optimizer settings.
        optimizer?: {
            // Enable the optimizer.
            enabled?: boolean
            // Set the optimization parameter. Use `3` for best performance and `z` for minimal size. Defaults to `3`
            parameters?: "0" | "1" | "2" | "3" | "s" | "z"
            // Try to recompile with -Oz if the bytecode is too large.
            fallbackOz?: boolean
            // How many times runs the optimizer
            runs?: number
        }
        // Specify the path to the `solc` executable.
        solcPath?: string
        // Dump all IRs to files in the specified directory. Only for testing and debugging.
        debugOutputDir?: string
        // If compilerSource == "npm", this option is ignored.
        resolcPath?: string
        // Specific contracts present in source to be compiled
        contractsToCompile?: string[]
        // Generate source based debug information in the output code file. This only has an effect with the LLVM-IR code generator and is ignored otherwise.
        emitDourceDebugInfo?: boolean
    }
}

export interface TargetVM {
    target?: "evm" | "pvm"
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

export interface ContractSource {
    [key: string]: object
}

export interface Sources {
    [key: string]: {
        id: number
        ast: object
    }
}

export interface ResolcBuild {
    version: string
    longVersion: string
    resolcPath: string
    isJs: boolean
}

export interface ICompiler {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    compile(input: CompilerInput, config: ResolcConfig): Promise<any>
}

export enum CompilerName {
    LINUX = "resolc-x86_64-unknown-linux-musl",
    WINDOWS = "resolc-x86_64-pc-windows-msvc.exe",
    MACOS = "resolc-universal-apple-darwin",
    WASM = "resolc.wasm",
}
export interface ResolcCompiler {
    version: string
    longVersion: string
    resolcPath: string
    isJs: boolean
}

export interface CompilerBuild {
    name: CompilerName
    path: string
    version: string
    build: string
    longVersion: string
    sha256: string
    platform: CompilerPlatform
}

export interface CompilerList {
    builds: CompilerBuild[]
    releases: { [version: string]: string }
    latestRelease: string
}
