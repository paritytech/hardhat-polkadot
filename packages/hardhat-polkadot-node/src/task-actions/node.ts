import type { TaskOverrideActionFunction } from "hardhat/types/tasks"

import { DEFAULT_NETWORK_NAME } from "../constants.js"

const nodeAction: TaskOverrideActionFunction = async (taskArguments, hre, runSuper) => {
    const networkName = hre.globalOptions.network ?? DEFAULT_NETWORK_NAME
    const networkConfig = hre.config.networks[networkName]
    const isPolkadot = networkConfig && "polkadot" in networkConfig && !!networkConfig.polkadot

    if (!isPolkadot || networkName !== DEFAULT_NETWORK_NAME) {
        return runSuper(taskArguments)
    }

    return hre.tasks.getTask("node-polkadot").run({
        hostname: taskArguments.hostname,
        port: taskArguments.port,
    })
}

export default nodeAction
