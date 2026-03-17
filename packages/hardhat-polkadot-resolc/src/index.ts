import type { HardhatPlugin } from "hardhat/types/plugins"

import "./type-extensions.js"

// Re-export public types for consumers
export type { ResolcConfig, ResolcBuild, ReviveCompilerInput } from "./types.js"
export { ResolcPluginError } from "./errors.js"
export { ResolcCompilerDownloader } from "./downloader.js"

const hardhatPolkadotResolcPlugin: HardhatPlugin = {
    id: "hardhat-polkadot-resolc",
    npmPackage: "@parity/hardhat-polkadot-resolc",
    hookHandlers: {},
    tasks: [],
}

export default hardhatPolkadotResolcPlugin
