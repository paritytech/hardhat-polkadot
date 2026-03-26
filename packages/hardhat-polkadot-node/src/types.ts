import type { EdrNetworkUserConfig } from "hardhat/types/config"
import { ChopsticksService, EthRpcService, SubstrateNodeService } from "./services/index.js"

/**
 * Forking config for internal use.
 * HH3's EdrNetworkForkingUserConfig has `url: SensitiveString`
 * (string | ConfigurationVariable). We keep `url` as `string` here
 * and cast at the boundary where HH3's forking config is assigned.
 */
export interface ForkingUserConfig {
    enabled?: boolean
    url?: string
    blockNumber?: string | number
}

export interface CommandArguments {
    forking?: ForkingUserConfig
    forkBlockNumber?: string | number
    nodeCommands?: EdrNetworkUserConfig["nodeConfig"]
    adapterCommands?: EdrNetworkUserConfig["adapterConfig"]
    docker?: EdrNetworkUserConfig["docker"]
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
