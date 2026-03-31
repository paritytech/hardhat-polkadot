import "hardhat/types/config"

import type { ResolcConfig, TargetVM } from "./types.js"

declare module "hardhat/types/config" {
    interface HardhatUserConfig {
        resolc?: Partial<ResolcConfig>
    }

    interface HardhatConfig {
        resolc?: ResolcConfig
    }

    interface EdrNetworkUserConfig {
        polkadot?: boolean | TargetVM
    }

    interface HttpNetworkUserConfig {
        polkadot?: boolean | TargetVM
    }

    interface EdrNetworkConfig {
        polkadot?: boolean | TargetVM
    }

    interface HttpNetworkConfig {
        polkadot?: boolean | TargetVM
    }
}
