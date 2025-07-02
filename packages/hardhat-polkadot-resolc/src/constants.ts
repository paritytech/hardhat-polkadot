import type { ResolcConfig } from "./types"

export const PLUGIN_NAME = "hardhat-polkadot"
export const RESOLC_ARTIFACT_FORMAT_VERSION = "hh-resolc-artifact-1"
export const DEFAULT_TIMEOUT_MILISECONDS = 30000

export const defaultNpmResolcConfig: ResolcConfig = {
    version: "latest",
    compilerSource: "npm",
    settings: {},
}

export const defaultBinaryResolcConfig: ResolcConfig = {
    version: "latest",
    compilerSource: "binary",
    settings: {
        compilerPath: "resolc",
        optimizer: {
            enabled: true,
            runs: 200
        },
    },
}
