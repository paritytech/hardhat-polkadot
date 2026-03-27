import type { EdrNetworkUserConfig } from "hardhat/types/config"
import Docker from "dockerode"

import { PolkadotNodePluginError } from "./errors.js"
import { RpcServer } from "./types.js"
import { EthRpcService } from "./services/eth-rpc.js"
import { SubstrateNodeService } from "./services/substrate-node.js"
import { ChopsticksService } from "./services/chopsticks.js"
import { getDockerSocketPath, getAvailablePort } from "./utils.js"
import { NODE_START_PORT, ETH_RPC_ADAPTER_START_PORT, MAX_PORT_ATTEMPTS } from "./constants.js"

export function createRpcServer(opts: {
    useAnvil: boolean
    docker?: EdrNetworkUserConfig["docker"]
    nodePath?: string
    adapterPath?: string
    isForking?: boolean
}): RpcServer {
    let substrateNodeService: SubstrateNodeService
    let ethRpcService: EthRpcService
    let chopsticksService: ChopsticksService

    return {
        services() {
            return {
                substrateNodeService: substrateNodeService ?? null,
                ethRpcService: ethRpcService ?? null,
                chopsticksService: chopsticksService ?? null,
            }
        },

        listen(
            nodeArgs: string[] = [],
            adapterArgs: string[] = [],
            blockProcess = true,
        ): Promise<void> {
            substrateNodeService = new SubstrateNodeService(nodeArgs, blockProcess, opts.useAnvil)
            ethRpcService = new EthRpcService(adapterArgs, blockProcess)
            chopsticksService = new ChopsticksService(nodeArgs, blockProcess)

            // Binary paths provided — use local binaries
            if (!!opts.nodePath && !!opts.useAnvil) {
                return substrateNodeService.from_binary(opts.nodePath)
            }

            if (!!opts.adapterPath && !!opts.nodePath && !opts.isForking) {
                return Promise.all([
                    substrateNodeService.from_binary(opts.nodePath),
                    ethRpcService.from_binary(opts.adapterPath),
                ]).then((): void => {})
            }

            if (!!opts.adapterPath && opts.isForking) {
                return Promise.all([
                    chopsticksService.from_binary(""),
                    ethRpcService.from_binary(opts.adapterPath),
                ]).then((): void => {})
            }

            // Docker — explicit or fallback when no binary paths given
            const useDocker = opts.docker || (!opts.nodePath && !opts.adapterPath)
            if (useDocker && !opts.isForking) {
                const docker = new Docker({
                    socketPath: getDockerSocketPath(opts.docker || true),
                })

                return (async () => {
                    substrateNodeService.port = await getAvailablePort(substrateNodeService.port || NODE_START_PORT, MAX_PORT_ATTEMPTS)
                    ethRpcService.port = await getAvailablePort(ethRpcService.port || ETH_RPC_ADAPTER_START_PORT, MAX_PORT_ATTEMPTS)
                    await Promise.all([
                        substrateNodeService.from_docker(docker),
                        ethRpcService.from_docker(docker, substrateNodeService.port),
                    ])
                })()
            }

            if (useDocker && opts.isForking) {
                const docker = new Docker({
                    socketPath: getDockerSocketPath(opts.docker || true),
                })

                return (async () => {
                    ethRpcService.port = await getAvailablePort(ethRpcService.port || ETH_RPC_ADAPTER_START_PORT, MAX_PORT_ATTEMPTS)
                    await chopsticksService.from_binary("")
                    await ethRpcService.from_docker(docker, chopsticksService.port)
                })()
            }

            throw new PolkadotNodePluginError(
                "Wrong hardhat network configuration. Please see https://github.com/paritytech/hardhat-polkadot/tree/main/examples",
            )
        },

        stop(): Promise<void> {
            return Promise.all([
                substrateNodeService.stop(),
                ethRpcService.stop(),
                chopsticksService.stop(),
            ]).then(() => undefined)
        },
    }
}
