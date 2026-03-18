import { HardhatNetworkUserConfig } from "hardhat/types/config"
import { ChopsticksService, EthRpcService, SubstrateNodeService } from "./services/index.js"

/**
 * Forking config (defined locally since HardhatNetworkForkingUserConfig
 * was removed in Hardhat v3).
 */
export interface ForkingUserConfig {
    enabled?: boolean
    url?: string
    blockNumber?: string | number
}

export interface CommandArguments {
    forking?: ForkingUserConfig
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

export interface TargetVM {
    target?: "evm" | "pvm"
}
