import type { HardhatPlugin } from "hardhat/types/plugins"
import { ArgumentType } from "hardhat/types/arguments"
import { overrideTask, task } from "hardhat/config"

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
        test: () => import("./hook-handlers/test.js"),
    },
    tasks: [
        overrideTask("test")
            .setAction(async () => import("./task-actions/test.js"))
            .build(),

        overrideTask(["test", "solidity"])
            .setAction(async () => import("./task-actions/test-solidity.js"))
            .build(),

        overrideTask("run")
            .setAction(async () => import("./task-actions/run.js"))
            .build(),

        overrideTask("node")
            .setAction(async () => import("./task-actions/node.js"))
            .build(),

        task("node-polkadot", "Start a Polkadot JSON-RPC server")
            .addOption({
                name: "hostname",
                description: "The host to bind to for new connections",
                type: ArgumentType.STRING_WITHOUT_DEFAULT,
                defaultValue: undefined,
            })
            .addOption({
                name: "port",
                description: "The port on which to listen for new connections",
                type: ArgumentType.INT,
                defaultValue: 8545,
            })
            .setAction(async () => import("./task-actions/node-polkadot.js"))
            .build(),
    ],
}

export default hardhatPolkadotNodePlugin
