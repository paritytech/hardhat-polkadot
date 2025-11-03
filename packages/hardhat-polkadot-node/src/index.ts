import { spawn } from "child_process"
import { task, subtask, scope } from "hardhat/config"
import {
    TASK_COMPILE,
    TASK_NODE,
    TASK_RUN,
    TASK_TEST,
    TASK_TEST_GET_TEST_FILES,
    TASK_TEST_RUN_MOCHA_TESTS,
    TASK_TEST_SETUP_TEST_ENVIRONMENT,
} from "hardhat/builtin-tasks/task-names"

import { HARDHAT_NETWORK_NAME } from "hardhat/plugins"
import { TaskArguments } from "hardhat/types"
import { HardhatNetworkUserConfig } from "hardhat/types/config"
import path from "path"

import {
    NODE_START_PORT,
    ETH_RPC_ADAPTER_START_PORT,
    MAX_PORT_ATTEMPTS,
    TASK_NODE_POLKADOT,
    TASK_NODE_POLKADOT_CREATE_SERVER,
    TASK_RUN_POLKADOT_NODE_IN_SEPARATE_PROCESS,
    POLKADOT_NETWORK_ACCOUNTS,
} from "./constants"
import { createRpcServer } from "./rpc-server"
import {
    adjustTaskArgsForPort,
    configureNetwork,
    constructCommandArgs,
    getAvailablePort,
} from "./utils"
import { PolkadotNodePluginError } from "./errors"
import { interceptAndWrapTasksWithNode } from "./core/global-interceptor"
import { handleFactoryDependencies } from "./core/factory-support"
import { runScriptWithHardhat } from "./core/script-runner"
import { RpcServer } from "./types"
import "./type-extensions"

task(TASK_RUN).setAction(async (args, hre, runSuper) => {
    if (!hre.network.polkadot || hre.network.name !== HARDHAT_NETWORK_NAME) {
        await runSuper(args, hre)
        return
    }

    await runScriptWithHardhat(
        {
            forking: hre.config.networks.hardhat.forking,
            forkBlockNumber: hre.config.networks.hardhat.forking?.blockNumber,
            nodeCommands: hre.userConfig.networks?.hardhat?.nodeConfig,
            adapterCommands: hre.userConfig.networks?.hardhat?.adapterConfig,
            docker: hre.userConfig.networks?.hardhat?.docker,
        },
        hre.hardhatArguments,
        path.resolve(args.script),
    )
})

subtask(TASK_NODE_POLKADOT_CREATE_SERVER, "Creates a JSON-RPC server for Polkadot node")
    .setAction(
        async (
            {
                nodePath,
                adapterPath,
                docker,
                useAnvil,
            }: {
                nodePath: string
                adapterPath: string
                useAnvil: boolean
                docker: HardhatNetworkUserConfig["docker"]
            },
            { config },
        ) => {
            const server: RpcServer = createRpcServer({
                useAnvil,
                docker,
                nodePath,
                adapterPath,
                isForking: config.networks.hardhat.forking?.enabled,
            })
            return server
        },
    )

task(TASK_NODE, "Start a Polkadot Node").setAction(
    async (args: TaskArguments, { network, run }, runSuper) => {
        if (!network.polkadot || network.name !== HARDHAT_NETWORK_NAME) {
            return await runSuper()
        }
        await run(TASK_NODE_POLKADOT, args)
    },
)

task(TASK_NODE_POLKADOT, "Starts a JSON-RPC server for Polkadot node").setAction(
    async ({ run, config, userConfig }) => {
        const commandArgs = constructCommandArgs({
            forking: config.networks.hardhat.forking,
            forkBlockNumber: config.networks.hardhat.forking?.blockNumber,
            nodeCommands: userConfig.networks?.hardhat?.nodeConfig,
            adapterCommands: userConfig.networks?.hardhat?.adapterConfig,
        })

        const nodePath = userConfig.networks?.hardhat?.nodeConfig?.nodeBinaryPath
        const adapterPath = userConfig.networks?.hardhat?.adapterConfig?.adapterBinaryPath

            const server: RpcServer = await run(TASK_NODE_POLKADOT_CREATE_SERVER, {
                useAnvil: !!userConfig.networks?.hardhat?.nodeConfig?.useAnvil,
                docker: userConfig.networks?.hardhat?.docker,
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
        if (!noCompile) await run(TASK_COMPILE, { quiet: true })

        const useAnvil = !!userConfig.networks?.hardhat?.nodeConfig?.useAnvil

        if (!network.config.polkadot || network.name !== HARDHAT_NETWORK_NAME) {
            // If remote polkadot network
            if (network.config.polkadot)
                await handleFactoryDependencies(
                    config.paths.artifacts,
                    network.config.url,
                    network.config.polkadotUrl,
                    network.config.accounts,
                    useAnvil,
                )
            return await runSuper()
        }

        const files = await run(TASK_TEST_GET_TEST_FILES, { testFiles })

        await run(TASK_TEST_SETUP_TEST_ENVIRONMENT)

        let nodePort = userConfig.networks?.hardhat?.nodeConfig?.rpcPort || NODE_START_PORT
        let adapterPort =
            userConfig.networks?.hardhat?.adapterConfig?.adapterPort || ETH_RPC_ADAPTER_START_PORT
        nodePort = await getAvailablePort(nodePort, MAX_PORT_ATTEMPTS)
        adapterPort = await getAvailablePort(adapterPort, MAX_PORT_ATTEMPTS)

        const nodePath = userConfig.networks?.hardhat?.nodeConfig?.nodeBinaryPath
        const adapterPath = userConfig.networks?.hardhat?.adapterConfig?.adapterBinaryPath

        const server: RpcServer = await run(TASK_NODE_POLKADOT_CREATE_SERVER, {
            useAnvil,
            docker: userConfig.networks?.hardhat?.docker,
            nodePath,
            adapterPath,
        })

        const nodeCommands: HardhatNetworkUserConfig["nodeConfig"] = Object.assign(
            {},
            userConfig.networks?.hardhat?.nodeConfig,
            {
                rpcPort: nodePort,
            },
        )
        const adapterCommands: HardhatNetworkUserConfig["adapterConfig"] = Object.assign(
            {},
            userConfig.networks?.hardhat?.adapterConfig,
            {
                adapterPort,
            },
        )

        const commandArgs = constructCommandArgs({
            forking: config.networks.hardhat.forking,
            forkBlockNumber: config.networks.hardhat.forking?.blockNumber,
            nodeCommands,
            adapterCommands,
        })

        try {
            await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands, false)
            await server.services().substrateNodeService?.waitForNodeToBeReady()
            if (!useAnvil) await server.services().ethRpcService?.waitForEthRpcToBeReady()
            await configureNetwork(
                config,
                network,
                useAnvil ? adapterPort : adapterPort || nodePort,
            )

            let testFailures = 0
            try {
                await handleFactoryDependencies(
                    config.paths.artifacts,
                    `http://localhost:${adapterPort}`,
                    `ws://localhost:${nodePort}`,
                    POLKADOT_NETWORK_ACCOUNTS,
                    useAnvil,
                )
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

// extends https://github.com/NomicFoundation/hardhat/blob/ba9d569d0ef251e5523d9e8ef0b2c359cc436f27/v-next/hardhat-ignition/src/index.ts#L10
scope("ignition").task("deploy", async (_taskArgs, { config }, runSuper) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ignitionConfig = (config as any).ignition || {}
    if (config.networks?.hardhat?.forking) ignitionConfig.requiredConfirmations = 1
    return await runSuper()
})

interceptAndWrapTasksWithNode()
