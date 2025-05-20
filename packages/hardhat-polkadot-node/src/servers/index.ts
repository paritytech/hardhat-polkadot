import { PolkadotNodePluginError } from "../errors"
import { RpcServer } from "../types"
import { PathToBinariesRpcServer } from "./path-to-binaries-server"
import { DockerRpcServer } from "./docker-server"

export function createRpcServer(opts: {
    nodePath?: string
    adapterPath?: string
    isForking?: boolean
}): RpcServer {
    if ((!!opts.nodePath && !!opts.adapterPath) || (opts.isForking && !!opts.adapterPath)) {
        return new PathToBinariesRpcServer(opts.nodePath, opts.adapterPath)
    } else if (!opts.nodePath && !opts.adapterPath && !opts.isForking) {
        return new DockerRpcServer()
    }

    throw new PolkadotNodePluginError(
        "Wrong network configuration. Please check https://github.com/paritytech/hardhat-polkadot/tree/main/examples",
    )
}
