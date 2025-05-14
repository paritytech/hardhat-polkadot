import { spawn } from "child_process"
import { task, subtask, types } from "hardhat/config"
import {
    TASK_COMPILE,
    TASK_NODE,
    TASK_RUN,
    TASK_TEST,
    TASK_TEST_GET_TEST_FILES,
    TASK_TEST_RUN_MOCHA_TESTS,
} from "hardhat/builtin-tasks/task-names"

import { HARDHAT_NETWORK_NAME } from "hardhat/plugins"
import { TaskArguments } from "hardhat/types"
import path from "path"
import {
    NODE_START_PORT,
    ETH_RPC_ADAPTER_START_PORT,
    MAX_PORT_ATTEMPTS,
    TASK_NODE_POLKADOT,
    TASK_NODE_POLKADOT_CREATE_SERVER,
    TASK_RUN_POLKADOT_NODE_IN_SEPARATE_PROCESS,
} from "./constants"
import { JsonRpcServer } from "./server"
import {
    adjustTaskArgsForPort,
    configureNetwork,
    constructCommandArgs,
    getAvailablePort,
    waitForNodeToBeReady,
} from "./utils"
import { PolkadotNodePluginError } from "./errors"
import { interceptAndWrapTasksWithNode } from "./core/global-interceptor"
import { runScriptWithHardhat } from "./core/script-runner"
import { AdapterConfig, NodeConfig, RpcServer } from "./types"
import "./type-extensions"

task(TASK_RUN).setAction(async (args, hre, runSuper) => {
    if (!hre.network.polkavm || hre.network.name !== HARDHAT_NETWORK_NAME) {
        await runSuper(args, hre)
        return
    }

    await runScriptWithHardhat(
        {
            forking: hre.config.networks.hardhat.forking,
            forkBlockNumber: hre.config.networks.hardhat.forking?.blockNumber,
            nodeCommands: hre.userConfig.networks?.hardhat?.nodeConfig,
            adapterCommands: hre.userConfig.networks?.hardhat?.adapterConfig,
        },
        hre.hardhatArguments,
        path.resolve(args.script),
    )
})

subtask(TASK_NODE_POLKADOT_CREATE_SERVER, "Creates a JSON-RPC server for Polkadot node")
    .addOptionalParam("nodePath", "Path to the node binary file", undefined, types.string)
    .addOptionalParam(
        "adapterPath",
        "Path to the Eth Rpc Adapter binary file",
        undefined,
        types.string,
    )
    .setAction(async ({ nodePath, adapterPath }: { nodePath: string; adapterPath: string }) => {
        const server: JsonRpcServer = new JsonRpcServer(nodePath, adapterPath)
        return server
    })

task(TASK_NODE, "Start a Polkadot Node").setAction(
    async (args: TaskArguments, { network, run }, runSuper) => {
        if (network.polkavm !== true || network.name !== HARDHAT_NETWORK_NAME) {
            return await runSuper()
        }

        await run(TASK_NODE_POLKADOT, args)
    },
)

task(TASK_NODE_POLKADOT, "Starts a JSON-RPC server for Polkadot node")
    .addOptionalParam(
        "nodeBinaryPath",
        "Path to the substrate node binary",
        undefined,
        types.string,
    )
    .addOptionalParam(
        "rpcPort",
        "Port where the node will listen on - default: 8000",
        undefined,
        types.int,
    )
    .addOptionalParam(
        "adapterBinaryPath",
        "Path to the eth-rpc-adapter binary",
        undefined,
        types.string,
    )
    .addOptionalParam(
        "adapterEndpoint",
        "Endpoint to which the adapter will connect to - default: ws://localhost:8000",
        undefined,
        types.string,
    )
    .addOptionalParam(
        "adapterPort",
        "Port where the adapter will listen on - default: 8545 ",
        undefined,
        types.int,
    )
    .addOptionalParam(
        "dev",
        "Whether to run the adapter in dev mode - default: false",
        undefined,
        types.boolean,
    )
    .addOptionalParam(
        "buildBlockMode",
        "Build block mode for @acala-network/chopsticks",
        undefined,
        types.string,
    )
    .addOptionalParam(
        "fork",
        "Endpoint to fork a live chain using @acala-network/chopsticks",
        undefined,
        types.string,
    )
    .addOptionalParam(
        "forkBlockNumber",
        "Block hash or block number from where to fork",
        undefined,
        types.string,
    )
    .setAction(
        async (
            {
                nodeBinaryPath,
                rpcPort,
                adapterBinaryPath,
                adapterEndpoint,
                adapterPort,
                dev,
                buildBlockMode,
                fork,
                forkBlockNumber,
            }: {
                nodeBinaryPath: string
                rpcPort: number
                adapterBinaryPath: string
                adapterEndpoint: string
                adapterPort: number
                dev: boolean
                buildBlockMode: "Instant" | "Manual" | "Batch"
                fork: string
                forkBlockNumber: string
            },
            { run, config, userConfig },
        ) => {
            const commandArgs = constructCommandArgs(
                {
                    forking: config.networks.hardhat.forking,
                    forkBlockNumber: config.networks.hardhat.forking?.blockNumber,
                    nodeCommands: userConfig.networks?.hardhat?.nodeConfig,
                    adapterCommands: userConfig.networks?.hardhat?.adapterConfig,
                },
                {
                    nodeBinaryPath,
                    rpcPort,
                    adapterBinaryPath,
                    adapterEndpoint,
                    adapterPort,
                    dev,
                    buildBlockMode,
                    fork,
                    forkBlockNumber,
                },
            )

            const nodePath = nodeBinaryPath
                ? nodeBinaryPath
                : userConfig.networks?.hardhat?.nodeConfig?.nodeBinaryPath
            const adapterPath = adapterBinaryPath
                ? adapterBinaryPath
                : userConfig.networks?.hardhat?.adapterConfig?.adapterBinaryPath

            const server: RpcServer = await run(TASK_NODE_POLKADOT_CREATE_SERVER, {
                nodePath,
                adapterPath,
            })

            try {
                await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                throw new PolkadotNodePluginError(`Failed when running node: ${error.message}`)
            }
        },
    )

subtask(
    TASK_RUN_POLKADOT_NODE_IN_SEPARATE_PROCESS,
    "Runs a Hardhat Polkadot task in a separate process.",
)
    .addVariadicPositionalParam("taskArgs", "Arguments for the Hardhat Polkadot task.")
    .setAction(async ({ taskArgs = [] }, _hre) => {
        const currentPort = await getAvailablePort(ETH_RPC_ADAPTER_START_PORT, MAX_PORT_ATTEMPTS)
        const adjustedArgs = adjustTaskArgsForPort(taskArgs, currentPort)

        const taskProcess = spawn("npx", ["hardhat", TASK_NODE_POLKADOT, ...adjustedArgs], {
            detached: true,
        })

        return {
            process: taskProcess,
            port: currentPort,
        }
    })

task(
    TASK_TEST,
    async (
        {
            testFiles,
            noCompile,
            parallel,
            bail,
            grep,
        }: {
            testFiles: string[]
            noCompile: boolean
            parallel: boolean
            bail: boolean
            grep?: string
        },
        { run, network, userConfig, config },
        runSuper,
    ) => {
        if (network.polkavm !== true || network.name !== HARDHAT_NETWORK_NAME) {
            return await runSuper()
        }

        if (!noCompile) {
            await run(TASK_COMPILE, { quiet: true })
        }

        const files = await run(TASK_TEST_GET_TEST_FILES, { testFiles })

        const currentNodePort = await getAvailablePort(
            userConfig.networks?.hardhat?.nodeConfig?.rpcPort
                ? userConfig.networks.hardhat.nodeConfig.rpcPort
                : NODE_START_PORT,
            MAX_PORT_ATTEMPTS,
        )

        const currentAdapterPort = await getAvailablePort(
            userConfig.networks?.hardhat?.adapterConfig?.adapterPort
                ? userConfig.networks.hardhat.adapterConfig.adapterPort
                : ETH_RPC_ADAPTER_START_PORT,
            MAX_PORT_ATTEMPTS,
        )

        const nCommands: NodeConfig = Object.assign({}, userConfig.networks?.hardhat?.nodeConfig, {
            port: currentNodePort,
        })
        const aCommands: AdapterConfig = Object.assign(
            {},
            userConfig.networks?.hardhat?.adapterConfig,
            {
                adapterPort: currentAdapterPort,
            },
        )

        const commandArgs = constructCommandArgs({
            forking: config.networks.hardhat.forking,
            forkBlockNumber: config.networks.hardhat.forking?.blockNumber,
            nodeCommands: nCommands,
            adapterCommands: aCommands,
        })

        const server = new JsonRpcServer(
            userConfig.networks?.hardhat?.nodeConfig?.nodeBinaryPath,
            userConfig.networks?.hardhat?.adapterConfig?.adapterBinaryPath,
        )

        try {
            await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands, false)
            await waitForNodeToBeReady(currentNodePort)
            await waitForNodeToBeReady(currentAdapterPort, true)
            await configureNetwork(
                config,
                network,
                currentAdapterPort ? currentAdapterPort : currentNodePort,
            )

            let testFailures = 0
            try {
                testFailures = await run(TASK_TEST_RUN_MOCHA_TESTS, {
                    testFiles: files,
                    parallel,
                    bail,
                    grep,
                })
            } finally {
                await server.stop()
            }

            process.exitCode = testFailures
            return testFailures
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            throw new PolkadotNodePluginError(`Failed when running node: ${error.message}`)
        }
    },
)

interceptAndWrapTasksWithNode()
