import { HardhatNetworkForkingUserConfig } from "hardhat/types"
import { HardhatNetworkUserConfig } from "hardhat/types/config"

export interface CliCommands {
    nodeBinaryPath?: string
    rpcPort?: number
    adapterBinaryPath?: string
    adapterEndpoint?: string
    adapterPort?: number
    dev?: boolean
    buildBlockMode?: "Instant" | "Manual" | "Batch"
    fork?: string
    forkBlockNumber?: string
}

export interface NodeConfig {
    nodeBinaryPath?: string
    rpcPort?: number
    dev?: boolean
    consensus?: Consensus
}

export interface AdapterConfig {
    adapterBinaryPath?: string
    /**
     * @deprecated This property should not be used
     */
    adapterEndpoint?: string
    adapterPort?: number
    dev?: boolean
    buildBlockMode?: "Instant" | "Manual" | "Batch"
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

export interface Consensus {
    seal?: "Instant" | "Manual" | "None"
    period?: string | number
}
