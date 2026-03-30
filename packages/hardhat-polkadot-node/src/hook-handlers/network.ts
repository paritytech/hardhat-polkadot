import type { HookContext } from "hardhat/types/hooks"
import type { NetworkConnection, ChainType } from "hardhat/types/network"
import type { EdrNetworkUserConfig } from "hardhat/types/config"
import type { JsonRpcRequest, JsonRpcResponse } from "hardhat/types/providers"

import axios from "axios"

import { startServer } from "../utils.js"
import { BASE_URL } from "../constants.js"
import type { RpcServer } from "../types.js"

// NetworkHooks is augmented onto HardhatHooks by the network-manager builtin plugin.
// Not re-exported from a public path; duplicated here. Keep in sync with
// hardhat/src/internal/builtin-plugins/network-manager/type-extensions/hooks.ts
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
    onRequest: <ChainTypeT extends ChainType | string>(
        context: HookContext,
        networkConnection: NetworkConnection<ChainTypeT>,
        jsonRpcRequest: JsonRpcRequest,
        next: (
            nextContext: HookContext,
            nextNetworkConnection: NetworkConnection<ChainTypeT>,
            nextJsonRpcRequest: JsonRpcRequest,
        ) => Promise<JsonRpcResponse>,
    ) => Promise<JsonRpcResponse>
}

// Per-network server state
interface PolkadotServer {
    server: RpcServer
    url: string
    refCount: number
}

const polkadotServers = new Map<string, PolkadotServer>()
const pendingStarts = new Map<string, Promise<PolkadotServer>>()
// Map connection IDs to their network name for cleanup
const connectionNetworks = new Map<number, string>()

function isPolkadotNetwork(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    network: Record<string, any> | undefined,
): boolean {
    if (!network || !("polkadot" in network) || !network.polkadot) return false
    const polkadot = network.polkadot
    if (typeof polkadot !== "boolean" && polkadot?.target === "evm") return false
    return true
}

async function ensureServerStarted(
    networkName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userNetworkConfig: Record<string, any>,
): Promise<PolkadotServer> {
    // Already running
    const existing = polkadotServers.get(networkName)
    if (existing) {
        existing.refCount++
        return existing
    }

    // Another connection is already starting this server — wait for it
    const pending = pendingStarts.get(networkName)
    if (pending) {
        const result = await pending
        result.refCount++
        return result
    }

    // Start the server
    const startPromise = (async (): Promise<PolkadotServer> => {
        const edrConfig = userNetworkConfig as EdrNetworkUserConfig
        const nodeConfig = edrConfig.nodeConfig
        const adapterConfig = edrConfig.adapterConfig
        const docker = edrConfig.docker
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const forking = (edrConfig as any).forking as
            | { enabled?: boolean; url?: string }
            | undefined

        const { commandArgs, server, port } = await startServer(
            {
                forking,
                nodeCommands: nodeConfig,
                adapterCommands: adapterConfig,
                docker,
            },
            nodeConfig?.nodeBinaryPath,
            adapterConfig?.adapterBinaryPath,
        )

        await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands, false)
        await server.services().substrateNodeService?.waitForNodeToBeReady()

        const polkadotServer: PolkadotServer = {
            server,
            url: `${BASE_URL}:${port}`,
            refCount: 1,
        }
        polkadotServers.set(networkName, polkadotServer)
        return polkadotServer
    })()

    pendingStarts.set(networkName, startPromise)
    try {
        return await startPromise
    } finally {
        pendingStarts.delete(networkName)
    }
}

const networkHookHandler: () => Promise<Partial<NetworkHooks>> = async () => ({
    newConnection: async (context, next) => {
        const connection = await next(context)

        const userNetworks = context.userConfig.networks ?? {}
        const networkName = connection.networkName
        const userNetworkConfig = userNetworks[networkName]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (userNetworkConfig && isPolkadotNetwork(userNetworkConfig as any)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ps = await ensureServerStarted(networkName, userNetworkConfig as any)
            connectionNetworks.set(connection.id, networkName)
            // Store URL on connection for downstream code (e.g. factory-deps)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(connection as any).localPolkadotUrl = ps.url
        }

        return connection
    },

    onRequest: async (context, networkConnection, jsonRpcRequest, next) => {
        const networkName = networkConnection.networkName
        const ps = polkadotServers.get(networkName)
        if (!ps) {
            // Not a polkadot network — pass through to EDR/HTTP
            return next(context, networkConnection, jsonRpcRequest)
        }

        // Proxy the JSON-RPC request to the local polkadot server
        const response = await axios.post(ps.url, jsonRpcRequest)
        return response.data as JsonRpcResponse
    },

    closeConnection: async (context, networkConnection, next) => {
        const networkName = connectionNetworks.get(networkConnection.id)
        if (networkName) {
            connectionNetworks.delete(networkConnection.id)
            const ps = polkadotServers.get(networkName)
            if (ps) {
                ps.refCount--
                if (ps.refCount <= 0) {
                    await ps.server.stop()
                    polkadotServers.delete(networkName)
                }
            }
        }

        return next(context, networkConnection)
    },
})

export default networkHookHandler
