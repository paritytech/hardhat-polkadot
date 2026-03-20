import type { HardhatPlugin } from "hardhat/types/plugins"
import { overrideTask, task } from "hardhat/config"

import "./type-extensions.js"

// Re-export public types and utilities for consumers
export type { RpcServer, CommandArguments, TargetVM } from "./types.js"
export { createRpcServer } from "./rpc-server.js"
export { PolkadotNodePluginError } from "./errors.js"

const hardhatPolkadotNodePlugin: HardhatPlugin = {
    id: "hardhat-polkadot-node",
    npmPackage: "@parity/hardhat-polkadot-node",
    dependencies: () => [
        import(
            "hardhat/internal/builtin-plugins/network-manager/index.js"
        ) as unknown as Promise<{ default: HardhatPlugin }>,
    ],
    hookHandlers: {
        config: () => import("./hook-handlers/config.js"),
        hre: () => import("./hook-handlers/hre.js"),
        network: () => import("./hook-handlers/network.js"),
    },
    tasks: [
        overrideTask("test")
            .setAction(async () => import("./task-actions/test.js"))
            .build(),

        overrideTask("run")
            .setAction(async () => import("./task-actions/run.js"))
            .build(),

        overrideTask("node")
            .setAction(async () => import("./task-actions/node.js"))
            .build(),

        task("node-polkadot", "Start a Polkadot JSON-RPC server")
            .setAction(async () => import("./task-actions/node-polkadot.js"))
            .build(),
    ],
}

export default hardhatPolkadotNodePlugin
