import { RpcServer } from "../types"
import { PathToBinariesRpcServer } from "./path-to-binaries-server"
import { DockerRpcServer } from "./docker-server"

export function createRpcServer(opts: { nodePath?: string; adapterPath?: string }): RpcServer {
    if (!!opts.nodePath && !!opts.adapterPath) {
        return new PathToBinariesRpcServer(opts.nodePath, opts.adapterPath)
    }
    return new DockerRpcServer()
}
