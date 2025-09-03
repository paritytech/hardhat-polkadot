import { HardhatNetworkUserConfig } from "hardhat/types/config"
import Docker from "dockerode"

import { PolkadotNodePluginError } from "./errors"
import { RpcServer } from "./types"
import { EthRpcService } from "./services/eth-rpc"
import { SubstrateNodeService } from "./services/substrate-node"
import { ChopsticksService } from "./services/chopsticks"
import { getDockerSocketPath } from "./utils"

export function createRpcServer(opts: {
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
            substrateNodeService = new SubstrateNodeService(nodeArgs, blockProcess)
            ethRpcService = new EthRpcService(adapterArgs, blockProcess)
            chopsticksService = new ChopsticksService(nodeArgs, blockProcess)

            if (!!opts.adapterPath && !!opts.nodePath && !opts.isForking) {
                return Promise.all([
                    substrateNodeService.from_binary(opts.nodePath),
                    ethRpcService.from_binary(opts.adapterPath),
                ]).then(() => {})
            }

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
