import "hardhat/types/config"
import { AdapterConfig, NodeConfig } from "./types"

declare module "hardhat/types/config" {
    interface HardhatNetworkUserConfig {
        polkavm?: boolean
        nodeConfig?: NodeConfig
        adapterConfig?: AdapterConfig
    }
    
    interface NetworksUserConfig {
        polkavm?: never;
        forking?: never;
        adapterConfig?: never;
    }

    interface HttpNetworkUserConfig {
        polkavm?: boolean
        nodeConfig?: NodeConfig
        adapterConfig?: AdapterConfig
    }

    interface HardhatNetworkConfig {
        polkavm?: boolean
        url?: string
    }

    interface HttpNetworkConfig {
        polkavm?: boolean
        ethNetwork?: string
    }
}

declare module "hardhat/types/runtime" {
    interface Network {
        polkavm?: boolean
    }
}
