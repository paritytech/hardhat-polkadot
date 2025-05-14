import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from "hardhat/types"
import { GlobalWithHardhatContext } from "hardhat/src/internal/context"
import { HARDHAT_NETWORK_NAME } from "hardhat/plugins"
import { Environment } from "hardhat/internal/core/runtime-environment"
import { configureNetwork, startServer, waitForNodeToBeReady } from "../utils"
import { PolkadotTasksWithWrappedNode } from "./global-task"

export function interceptAndWrapTasksWithNode() {
    const polkadotGlobal = global as PolkadotTasksWithWrappedNode & GlobalWithHardhatContext
    const taskMap = polkadotGlobal.__hardhatContext.tasksDSL.getTaskDefinitions()

    if (!polkadotGlobal._polkadotTasksForWrapping) {
        return
    }

    polkadotGlobal._polkadotTasksForWrapping.taskNames.forEach((taskName) => {
        const foundTask = taskMap[taskName]

        if (!foundTask) {
            return
        }

        if (foundTask.isSubtask) {
            polkadotGlobal.__hardhatContext.tasksDSL.subtask(
                foundTask.name,
                foundTask.description,
                wrapTaskWithNode,
            )
        }

        polkadotGlobal.__hardhatContext.tasksDSL.task(
            foundTask.name,
            foundTask.description,
            wrapTaskWithNode,
        )
    })
}

async function wrapTaskWithNode(
    taskArgs: TaskArguments,
    env: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
) {
    if (env.network.polkavm !== true || env.network.name !== HARDHAT_NETWORK_NAME) {
        return await runSuper(taskArgs)
    }
    const polkadotGlobal = global as PolkadotTasksWithWrappedNode

    const { commandArgs, server, port } = await startServer({
        forking: env.config.networks.hardhat.forking,
        forkBlockNumber: env.config.networks.hardhat.forking?.blockNumber,
        nodeCommands: env.userConfig.networks?.hardhat?.nodeConfig,
        adapterCommands: env.userConfig.networks?.hardhat?.adapterConfig,
    })
    try {
        await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands, false)
        await waitForNodeToBeReady(port)
        const oldNetwork = env.network
        await configureNetwork(env.config, env.network, port)
        ;(env as unknown as Environment).injectToGlobal()
        polkadotGlobal._polkadotNodeNetwork = env.network
        const result = await runSuper(taskArgs)
        ;(env as unknown as Environment).network = oldNetwork
        delete polkadotGlobal._polkadotNodeNetwork
        ;(env as unknown as Environment).injectToGlobal()
        return result
    } finally {
        await server.stop()
    }
}
