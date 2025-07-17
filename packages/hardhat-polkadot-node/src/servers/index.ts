import { HardhatNetworkUserConfig } from "hardhat/types/config"

import { PolkadotNodePluginError } from "../errors"
import { RpcServer } from "../types"
import { PathToBinariesRpcServer } from "./path-to-binaries-server"
import { DockerRpcServer } from "./docker-server"

export function createRpcServer(opts: {
    docker?: HardhatNetworkUserConfig["docker"]
    nodePath?: string
    adapterPath?: string
    isForking?: boolean
}): RpcServer {
    if ((!!opts.nodePath && !!opts.adapterPath) || (opts.isForking && !!opts.adapterPath)) {
        return new PathToBinariesRpcServer(opts.nodePath, opts.adapterPath)
    } else if (!opts.nodePath && !opts.adapterPath && !opts.isForking) {
        const dockerSocketPath = typeof opts.docker === "string" ? opts.docker : undefined
        return new DockerRpcServer(dockerSocketPath)
    }

    throw new PolkadotNodePluginError(
        "Wrong hardhat network configuration. Please see https://github.com/paritytech/hardhat-polkadot/tree/main/examples",
    )
}
