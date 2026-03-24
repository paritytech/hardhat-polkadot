import type { TaskOverrideActionFunction } from "hardhat/types/tasks"

// In v3, network hooks (newConnection) handle starting the polkadot
// node when a script creates a network connection. No explicit server
// management needed in the run override.
const runAction: TaskOverrideActionFunction = async (taskArguments, _hre, runSuper) => {
    return runSuper(taskArguments)
}

export default runAction
