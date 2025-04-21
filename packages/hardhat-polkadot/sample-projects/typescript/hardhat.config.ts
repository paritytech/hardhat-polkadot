import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
    solidity: '0.8.28',
    resolc: {
        compilerSource: 'npm',
    },
    networks: {
        hardhat: {
            polkavm: true,
            forking: {
                url: 'wss://westend-asset-hub-rpc.polkadot.io',
            },
        },
    }
};

export default config;
