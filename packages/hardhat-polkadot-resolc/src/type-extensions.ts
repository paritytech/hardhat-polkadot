import "hardhat/types/config"

import type { ResolcConfig, TargetVM } from "./types"

declare module "hardhat/types/config" {
    interface HardhatUserConfig {
        resolc?: Partial<ResolcConfig>
    }

    interface HardhatConfig {
        resolc: ResolcConfig
    }

    interface HardhatNetworkUserConfig {
        polkadot?: boolean | TargetVM
    }

    interface HttpNetworkUserConfig {
        polkadot?: boolean | TargetVM
    }

    interface HardhatNetworkConfig {
        polkadot?: boolean | TargetVM
    }

    interface HttpNetworkConfig {
        polkadot?: boolean | TargetVM
    }

    interface NetworksConfig {
        polkadot?: boolean | TargetVM
    }
}

declare module "hardhat/types/runtime" {
    interface Network {
        polkadot?: boolean | TargetVM
    }
}
