import { RunSuperFunction, TaskArguments } from "hardhat/types"
import { GlobalWithHardhatContext } from "hardhat/src/internal/context"
import { HARDHAT_NETWORK_NAME } from "hardhat/plugins"
import { configureNetwork, startServer, waitForNodeToBeReady } from "../utils"
import { PolkaVMTasksWithWrappedNode } from "./global-task"

export function interceptAndWrapTasksWithNode() {
    const polkaVMGlobal = global as PolkaVMTasksWithWrappedNode & GlobalWithHardhatContext
    const taskMap = polkaVMGlobal.__hardhatContext.tasksDSL.getTaskDefinitions()

    if (!polkaVMGlobal._polkaVMTasksForWrapping) {
        return
    }

    polkaVMGlobal._polkaVMTasksForWrapping.taskNames.forEach((taskName) => {
        const foundTask = taskMap[taskName]

        if (!foundTask) {
            return
        }

        if (foundTask.isSubtask) {
            polkaVMGlobal.__hardhatContext.tasksDSL.subtask(
                foundTask.name,
                foundTask.description,
                wrapTaskWithNode,
            )
        }

        polkaVMGlobal.__hardhatContext.tasksDSL.task(
            foundTask.name,
            foundTask.description,
            wrapTaskWithNode,
        )
    })
}

async function wrapTaskWithNode(
    taskArgs: TaskArguments,
    env: any,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    if (env.network.polkavm !== true || env.network.name !== HARDHAT_NETWORK_NAME) {
        return await runSuper(taskArgs)
    }
    const polkaVMGlobal = global as PolkaVMTasksWithWrappedNode
    const { commandArgs, server, port } = await startServer({
        forking: env.config.networks.hardhat.forking,
        forkBlockNumber: env.config.networks.hardhat.forking.blockNumber,
        nodeCommands: env.userConfig.networks.hardhat.nodeConfig,
        adapterCommands: env.userConfig.networks.hardhat.adapterConfig,
    })
    try {
        await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands, false)
        await waitForNodeToBeReady(port)
        const oldNetwork = env.network
        await configureNetwork(env.config, env.network, port)
        env.injectToGlobal()
        polkaVMGlobal._polkaVMNodeNetwork = env.network
        const result = await runSuper(taskArgs)
        env.network = oldNetwork
        delete polkaVMGlobal._polkaVMNodeNetwork
        env.injectToGlobal()
        return result
    } finally {
        await server.stop()
    }
}
