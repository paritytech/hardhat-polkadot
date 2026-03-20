import type { HardhatPlugin } from "hardhat/types/plugins"

import "./type-extensions.js"

// Re-export public types and utilities for consumers
export type { RpcServer, CommandArguments, TargetVM } from "./types.js"
export { createRpcServer } from "./rpc-server.js"
export { PolkadotNodePluginError } from "./errors.js"

const hardhatPolkadotNodePlugin: HardhatPlugin = {
    id: "hardhat-polkadot-node",
    npmPackage: "@parity/hardhat-polkadot-node",
    hookHandlers: {
        config: () => import("./hook-handlers/config.js"),
        hre: () => import("./hook-handlers/hre.js"),
        network: () => import("./hook-handlers/network.js"),
    },
    tasks: [],
}

export default hardhatPolkadotNodePlugin
