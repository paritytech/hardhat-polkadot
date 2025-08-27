import { HardhatNetworkForkingUserConfig } from "hardhat/types"
import { HardhatNetworkUserConfig } from "hardhat/types/config"
import { ChopsticksService, EthRpcService, SubstrateNodeService } from "./services"

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
    docker?: HardhatNetworkUserConfig["docker"]
}

export interface RpcServer {
    services(): {
        substrateNodeService: SubstrateNodeService | null
        ethRpcService: EthRpcService | null
        chopsticksService: ChopsticksService | null
    }
    listen(chopsticksArgs?: string[], adapterArgs?: string[], blockProcess?: boolean): Promise<void>
    stop(): Promise<void>
}

export interface SplitCommands {
    nodeCommands: string[]
    adapterCommands?: string[]
}
