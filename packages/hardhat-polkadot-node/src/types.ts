import { HardhatNetworkForkingUserConfig } from "hardhat/types"

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
    nodeCommands?: NodeConfig
    adapterCommands?: AdapterConfig
}

export interface RpcServer {
    listen(chopsticksArgs?: string[], adapterArgs?: string[], blockProcess?: boolean): Promise<void>
    stop(): Promise<void>
}

export interface SplitCommands {
    nodeCommands: string[]
    adapterCommands?: string[]
}
