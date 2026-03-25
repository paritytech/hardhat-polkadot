// TODO: Refactor to delegate server lifecycle to network hooks instead of managing it here
import type { TaskOverrideActionFunction } from "hardhat/types/tasks"
import type { EdrNetworkUserConfig } from "hardhat/types/config"

import { createRpcServer } from "../rpc-server.js"
import { configureNetwork, constructCommandArgs, getAvailablePort } from "../utils.js"
import { PolkadotNodePluginError } from "../errors.js"
import type { ForkingUserConfig } from "../types.js"
import { handleFactoryDependencies } from "../core/factory-support.js"
import {
    NODE_START_PORT,
    ETH_RPC_ADAPTER_START_PORT,
    MAX_PORT_ATTEMPTS,
    POLKADOT_NETWORK_ACCOUNTS,
    DEFAULT_NETWORK_NAME,
} from "../constants.js"

const testAction: TaskOverrideActionFunction = async (taskArguments, hre, runSuper) => {
    const networkName = hre.globalOptions.network ?? DEFAULT_NETWORK_NAME
    const networkConfig = hre.config.networks[networkName]
    const isPolkadot = networkConfig && "polkadot" in networkConfig && !!networkConfig.polkadot
    const isHardhatNetwork = networkName === DEFAULT_NETWORK_NAME

    if (!isPolkadot) {
        return runSuper(taskArguments)
    }

    // Build first if needed
    if (!taskArguments.noCompile) {
        await hre.tasks.getTask("build").run({ quiet: true, noTests: true })
    }

    const userConfig = hre.config.networks[DEFAULT_NETWORK_NAME] as unknown as EdrNetworkUserConfig
    const useAnvil = userConfig?.nodeConfig?.useAnvil !== false

    // For remote polkadot networks, just handle factory deps and run tests
    if (!isHardhatNetwork) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const httpConfig = networkConfig as any
        if (httpConfig.url) {
            await handleFactoryDependencies(
                hre.config.paths.artifacts,
                httpConfig.url,
                httpConfig.polkadotUrl,
                httpConfig.accounts ?? [],
                useAnvil,
            )
        }
        return runSuper(taskArguments)
    }

    // Local polkadot network - manage server lifecycle
    let nodePort = userConfig?.nodeConfig?.rpcPort || NODE_START_PORT
    let adapterPort = userConfig?.adapterConfig?.adapterPort || ETH_RPC_ADAPTER_START_PORT
    nodePort = await getAvailablePort(nodePort, MAX_PORT_ATTEMPTS)
    adapterPort = await getAvailablePort(adapterPort, MAX_PORT_ATTEMPTS)

    const nodePath = userConfig?.nodeConfig?.nodeBinaryPath
    const adapterPath = userConfig?.adapterConfig?.adapterBinaryPath

    const server = createRpcServer({
        useAnvil,
        docker: userConfig?.docker,
        nodePath,
        adapterPath,
        isForking: !!userConfig?.forking?.enabled,
    })

    const nodeCommands = Object.assign({}, userConfig?.nodeConfig, { rpcPort: nodePort })
    const adapterCommands = Object.assign({}, userConfig?.adapterConfig, { adapterPort })

    const commandArgs = constructCommandArgs({
        forking: userConfig?.forking as ForkingUserConfig | undefined,
        forkBlockNumber: userConfig?.forking?.blockNumber,
        nodeCommands,
        adapterCommands,
    })

    try {
        await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands, false)
        await server.services().substrateNodeService?.waitForNodeToBeReady()
        if (!useAnvil) await server.services().ethRpcService?.waitForEthRpcToBeReady()

        await configureNetwork(
            hre.config,
            { name: DEFAULT_NETWORK_NAME, config: networkConfig },
            useAnvil ? adapterPort : adapterPort || nodePort,
        )

        try {
            await handleFactoryDependencies(
                hre.config.paths.artifacts,
                `http://localhost:${adapterPort}`,
                `ws://localhost:${nodePort}`,
                POLKADOT_NETWORK_ACCOUNTS,
                useAnvil,
            )
            return await runSuper(taskArguments)
        } finally {
            await server.stop()
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new PolkadotNodePluginError(`Failed when running node: ${error.message}`)
    }
}

export default testAction
