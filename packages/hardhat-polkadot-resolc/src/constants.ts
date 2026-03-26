import type { ResolcConfig } from "./types.js"

export const PLUGIN_NAME = "hardhat-polkadot"
export const RESOLC_ARTIFACT_FORMAT_VERSION = "hh-resolc-artifact-1"
export const DEFAULT_TIMEOUT_MILISECONDS = 30000

export const COMPILER_REPOSITORY_URL = "https://github.com/paritytech/revive/releases/download/"
export const COMPILER_REPOSITORY_API_URL = "https://api.github.com/repos/paritytech/revive/releases"

export const RESOLC_VERSION_LATEST = "latest"

export const defaultNpmResolcConfig: ResolcConfig = {
    version: RESOLC_VERSION_LATEST,
    compilerSource: "npm",
    settings: {},
}

export const defaultBinaryResolcConfig: ResolcConfig = {
    version: RESOLC_VERSION_LATEST,
    compilerSource: "binary",
    settings: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
    },
}
