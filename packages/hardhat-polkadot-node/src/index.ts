import type { HardhatPlugin } from "hardhat/types/plugins"

import "./type-extensions.js"

// Re-export public types and utilities for consumers
export type { RpcServer, CommandArguments, TargetVM } from "./types.js"
export { createRpcServer } from "./rpc-server.js"
export { PolkadotNodePluginError } from "./errors.js"

const hardhatPolkadotNodePlugin: HardhatPlugin = {
    id: "hardhat-polkadot-node",
    npmPackage: "@parity/hardhat-polkadot-node",
    // Hook handlers will be added in subsequent PRs:
    // - config hooks (PR 6)
    // - network hooks (PR 7)
    hookHandlers: {},
    // Task definitions will be added in PR 8
    tasks: [],
}

export default hardhatPolkadotNodePlugin
