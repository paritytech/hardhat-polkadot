import { HardhatNetworkUserConfig } from "hardhat/types/config"
import Docker from "dockerode"

import { PolkadotNodePluginError } from "./errors"
import { ANVIL_POLKADOT_DEFAULT_BINARY } from "./constants"
import { RpcServer } from "./types"
import { EthRpcService } from "./services/eth-rpc"
import { SubstrateNodeService } from "./services/substrate-node"
import { ChopsticksService } from "./services/chopsticks"
import { getDockerSocketPath } from "./utils"

export function createRpcServer(opts: {
    useAnvil: boolean
    docker?: HardhatNetworkUserConfig["docker"]
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

            // Anvil mode (binary): use provided path or default binary name
            if (opts.useAnvil && !opts.isForking) {
                const anvilPath = opts.nodePath || ANVIL_POLKADOT_DEFAULT_BINARY
                return substrateNodeService.from_binary(anvilPath)
            }

            // Anvil mode (docker)
            if (opts.useAnvil && opts.docker && !opts.isForking) {
                const docker = new Docker({ socketPath: getDockerSocketPath(opts.docker) })
                return substrateNodeService.from_docker(docker)
            }

            // Legacy mode (binary): revive-node + eth-rpc adapter
            if (!!opts.adapterPath && !!opts.nodePath && !opts.isForking) {
                return Promise.all([
                    substrateNodeService.from_binary(opts.nodePath),
                    ethRpcService.from_binary(opts.adapterPath),
                ]).then(() => {})
            }

            // Legacy mode (docker): revive-node + eth-rpc adapter
            if (opts.docker && !opts.isForking) {
                const docker = new Docker({ socketPath: getDockerSocketPath(opts.docker) })

                return Promise.all([
                    substrateNodeService.from_docker(docker),
                    ethRpcService.from_docker(docker, substrateNodeService.port),
                ]).then(() => {})
            }

            if (!!opts.adapterPath && opts.isForking) {
                return Promise.all([
                    chopsticksService.from_binary(""),
                    ethRpcService.from_binary(opts.adapterPath),
                ]).then(() => {})
            }

            if (opts.docker && opts.isForking) {
                const docker = new Docker({ socketPath: getDockerSocketPath(opts.docker) })

                chopsticksService.from_binary("")
                return ethRpcService.from_docker(docker, chopsticksService.port)
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
