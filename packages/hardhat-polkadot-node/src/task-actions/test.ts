import type { TaskOverrideActionFunction } from "hardhat/types/tasks"

// The polkadot test runner is in the ["test", "solidity"] subtask override
// (test-solidity.ts).  This top-level override is a passthrough.
const testAction: TaskOverrideActionFunction = async (taskArguments, _hre, runSuper) => {
    return runSuper(taskArguments)
}

export default testAction
