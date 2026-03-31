import type { NewTaskActionFunction } from "hardhat/types/tasks"
import type { EdrNetworkConfig } from "hardhat/types/config"

import { createRpcServer } from "../rpc-server.js"
import { constructCommandArgs, getAvailablePort } from "../utils.js"
import { PolkadotNodePluginError } from "../errors.js"
import type { ForkingUserConfig } from "../types.js"
import {
    DEFAULT_NETWORK_NAME,
    ETH_RPC_ADAPTER_START_PORT,
    MAX_PORT_ATTEMPTS,
    NODE_START_PORT,
} from "../constants.js"

interface NodePolkadotArgs {
    hostname?: string
    port: number
}

const nodePolkadotAction: NewTaskActionFunction<NodePolkadotArgs> = async (taskArguments, hre) => {
    const networkConfig = hre.config.networks[DEFAULT_NETWORK_NAME] as EdrNetworkConfig

    // HH3's resolved forking config uses ResolvedConfigurationVariable/bigint,
    // but the plugin's config hook copies the raw user config values (string/number).
    // Cast through the internal ForkingUserConfig to match the runtime values.
    const forking = networkConfig?.forking as unknown as ForkingUserConfig | undefined

    // CLI --port overrides config adapterPort
    const useAnvil = networkConfig?.nodeConfig?.useAnvil !== false
    const cliPort = taskArguments.port
    const adapterPort = await getAvailablePort(
        cliPort ?? networkConfig?.adapterConfig?.adapterPort ?? ETH_RPC_ADAPTER_START_PORT,
        MAX_PORT_ATTEMPTS,
    )
    const nodePort = await getAvailablePort(
        networkConfig?.nodeConfig?.rpcPort ?? NODE_START_PORT,
        MAX_PORT_ATTEMPTS,
    )

    const commandArgs = constructCommandArgs({
        forking,
        forkBlockNumber: forking?.blockNumber,
        nodeCommands: Object.assign({}, networkConfig?.nodeConfig, { rpcPort: nodePort }),
        adapterCommands: Object.assign({}, networkConfig?.adapterConfig, { adapterPort }),
    })

    const server = createRpcServer({
        useAnvil,
        docker: networkConfig?.docker,
        nodePath: networkConfig?.nodeConfig?.nodeBinaryPath,
        adapterPath: networkConfig?.adapterConfig?.adapterBinaryPath,
        isForking: !!forking?.enabled,
    })

    try {
        await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new PolkadotNodePluginError(`Failed when running node: ${error.message}`)
    }
}

export default nodePolkadotAction
