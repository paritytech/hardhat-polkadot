import type { ResolcConfig } from "./types"

export const PLUGIN_NAME = "hardhat-polkadot"
export const RESOLC_ARTIFACT_FORMAT_VERSION = "hh-resolc-artifact-1"
export const DEFAULT_TIMEOUT_MILISECONDS = 30000
export const TASK_COMPILE_SOLIDITY_GET_RESOLC_BUILD = "compile:solidity:resolc:get-build"
export const TASK_COMPILE_SOLIDITY_COMPILE_RESOLC = "compile:solidity:resolc:compile"
export const TASK_COMPILE_SOLIDITY_RUN_RESOLC = "compile:solidity:resolc:run"

export const defaultNpmResolcConfig: ResolcConfig = {
    version: "latest",
    compilerSource: "npm",
    settings: {},
}

export const defaultBinaryResolcConfig: ResolcConfig = {
    version: "latest",
    compilerSource: "binary",
    settings: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
    },
}
