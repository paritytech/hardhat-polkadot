import type { HookContext } from "hardhat/types/hooks"
import type { NetworkConnection, ChainType } from "hardhat/types/network"
import type { EdrNetworkUserConfig } from "hardhat/types/config"

import { startServer } from "../utils.js"
import { BASE_URL } from "../constants.js"
import type { RpcServer } from "../types.js"

// NetworkHooks is augmented onto HardhatHooks by the network-manager builtin plugin
// (v-next/hardhat/src/internal/builtin-plugins/network-manager/type-extensions/hooks.ts).
// It is not re-exported from a public path; we duplicate the subset we need here.
interface NetworkHooks {
    newConnection: <ChainTypeT extends ChainType | string>(
        context: HookContext,
        next: (nextContext: HookContext) => Promise<NetworkConnection<ChainTypeT>>,
    ) => Promise<NetworkConnection<ChainTypeT>>
    closeConnection: <ChainTypeT extends ChainType | string>(
        context: HookContext,
        networkConnection: NetworkConnection<ChainTypeT>,
        next: (
            nextContext: HookContext,
            nextNetworkConnection: NetworkConnection<ChainTypeT>,
        ) => Promise<void>,
    ) => Promise<void>
}

// Track active servers per connection so we can clean up on close
const activeServers = new Map<number, RpcServer>()

const networkHookHandler: () => Promise<Partial<NetworkHooks>> = async () => ({
    newConnection: async (context, next) => {
        const connection = await next(context)

        const networkConfig = connection.networkConfig
        if (!("polkadot" in networkConfig) || !networkConfig.polkadot) {
            return connection
        }

        // Skip if targeting EVM
        const polkadot = networkConfig.polkadot
        if (typeof polkadot !== "boolean" && polkadot?.target === "evm") {
            return connection
        }

        // Get the user config for this network to read nodeConfig/adapterConfig
        const networkName = connection.networkName
        const userNetworkConfig = context.userConfig.networks?.[networkName]
        if (!userNetworkConfig) return connection

        // Cast to EdrNetworkUserConfig to access our augmented fields
        const edrConfig = userNetworkConfig as EdrNetworkUserConfig
        const nodeConfig = edrConfig.nodeConfig
        const adapterConfig = edrConfig.adapterConfig
        const docker = edrConfig.docker
        const forking = edrConfig.forking

        const { commandArgs, server, port } = await startServer(
            {
                forking: forking as { enabled?: boolean; url?: string } | undefined,
                nodeCommands: nodeConfig,
                adapterCommands: adapterConfig,
                docker,
            },
            nodeConfig?.nodeBinaryPath,
            adapterConfig?.adapterBinaryPath,
        )

        await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands, false)
        await server.services().substrateNodeService?.waitForNodeToBeReady()

        // Track the server for cleanup
        activeServers.set(connection.id, server)

        // Store the local URL on the resolved config so downstream code (e.g.
        // factory-deps) can discover it.  The connection's own provider was
        // already created by `next()`, so this does NOT redirect the provider;
        // the task-actions path (test.ts) remains the primary integration
        // point where the URL is wired up before the provider is created.
        // TODO: To fully integrate with HH3's connection model, polkadot
        // networks should resolve as type:"http" pointing at the local server
        // URL, so the provider is created with the correct endpoint. This
        // requires starting the server in resolveUserConfig or using the
        // onRequest hook to proxy requests.
        const localUrl = `${BASE_URL}:${port}`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(connection as any).localPolkadotUrl = localUrl

        return connection
    },

    closeConnection: async (context, networkConnection, next) => {
        const server = activeServers.get(networkConnection.id)
        if (server) {
            await server.stop()
            activeServers.delete(networkConnection.id)
        }

        return next(context, networkConnection)
    },
})

export default networkHookHandler
