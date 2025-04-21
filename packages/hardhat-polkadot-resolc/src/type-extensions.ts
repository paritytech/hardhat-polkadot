import 'hardhat/types/config';

import { ResolcConfig } from './types';

declare module 'hardhat/types/config' {
    interface HardhatUserConfig {
        resolc?: Partial<ResolcConfig>;
    }

    interface HardhatConfig {
        resolc: ResolcConfig;
    }

    interface HardhatNetworkUserConfig {
        polkavm?: boolean;
    }

    interface HttpNetworkUserConfig {
        polkavm?: boolean;
    }

    interface HardhatNetworkConfig {
        polkavm?: boolean;
    }

    interface HttpNetworkConfig {
        polkavm?: boolean;
    }

    interface NetworksConfig {
        polkavm?: boolean;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        polkavm?: boolean;
    }
}
