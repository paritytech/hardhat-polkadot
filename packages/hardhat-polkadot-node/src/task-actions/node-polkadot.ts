import type { NewTaskActionFunction } from "hardhat/types/tasks"
import type { EdrNetworkUserConfig } from "hardhat/types/config"

import { createRpcServer } from "../rpc-server.js"
import { constructCommandArgs } from "../utils.js"
import { PolkadotNodePluginError } from "../errors.js"
import type { ForkingUserConfig } from "../types.js"
import { DEFAULT_NETWORK_NAME } from "../constants.js"

const nodePolkadotAction: NewTaskActionFunction = async (_taskArguments, hre) => {
    const networkConfig = hre.config.networks[DEFAULT_NETWORK_NAME] as unknown as EdrNetworkUserConfig

    const commandArgs = constructCommandArgs({
        forking: networkConfig?.forking as ForkingUserConfig | undefined,
        forkBlockNumber: networkConfig?.forking?.blockNumber,
        nodeCommands: networkConfig?.nodeConfig,
        adapterCommands: networkConfig?.adapterConfig,
    })

    const nodePath = networkConfig?.nodeConfig?.nodeBinaryPath
    const adapterPath = networkConfig?.adapterConfig?.adapterBinaryPath

    const server = createRpcServer({
        useAnvil: networkConfig?.nodeConfig?.useAnvil !== false,
        docker: networkConfig?.docker,
        nodePath,
        adapterPath,
    })

    try {
        await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new PolkadotNodePluginError(`Failed when running node: ${error.message}`)
    }
}

export default nodePolkadotAction
