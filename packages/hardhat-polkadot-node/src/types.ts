import { HardhatNetworkForkingUserConfig } from "hardhat/types"
import { HardhatNetworkUserConfig } from "hardhat/types/config"

export interface CliCommands {
    nodeBinaryPath?: string
    rpcPort?: number
    adapterBinaryPath?: string
    adapterPort?: number
    dev?: boolean
    buildBlockMode?: "Instant" | "Manual" | "Batch"
    fork?: string
    forkBlockNumber?: string
}

export interface CommandArguments {
    forking?: HardhatNetworkForkingUserConfig
    forkBlockNumber?: string | number
    nodeCommands?: HardhatNetworkUserConfig["nodeConfig"]
    adapterCommands?: HardhatNetworkUserConfig["adapterConfig"]
}

export interface RpcServer {
    listen(chopsticksArgs?: string[], adapterArgs?: string[], blockProcess?: boolean): Promise<void>
    stop(): Promise<void>
}

export interface SplitCommands {
    nodeCommands: string[]
    adapterCommands?: string[]
}
