import type { NewTaskActionFunction } from "hardhat/types/tasks"
import type { EdrNetworkUserConfig } from "hardhat/types/config"

import { createRpcServer } from "../rpc-server.js"
import { constructCommandArgs } from "../utils.js"
import { PolkadotNodePluginError } from "../errors.js"

const HARDHAT_NETWORK_NAME = "hardhat"

const nodePolkadotAction: NewTaskActionFunction = async (_taskArguments, hre) => {
    const networkConfig = hre.config.networks[HARDHAT_NETWORK_NAME] as unknown as EdrNetworkUserConfig

    const commandArgs = constructCommandArgs({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        forking: (hre.config.networks[HARDHAT_NETWORK_NAME] as any)?.forking,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        forkBlockNumber: (hre.config.networks[HARDHAT_NETWORK_NAME] as any)?.forking?.blockNumber,
        nodeCommands: networkConfig?.nodeConfig,
        adapterCommands: networkConfig?.adapterConfig,
    })

    const nodePath = networkConfig?.nodeConfig?.nodeBinaryPath
    const adapterPath = networkConfig?.adapterConfig?.adapterBinaryPath

    const server = createRpcServer({
        useAnvil: !!networkConfig?.nodeConfig?.useAnvil,
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
