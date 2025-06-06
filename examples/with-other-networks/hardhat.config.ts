import '@nomicfoundation/hardhat-chai-matchers';
import '@parity/hardhat-polkadot';
import '@nomicfoundation/hardhat-ignition';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    solidity: '0.8.28',
    networks: {
        hardhat: {
            allowUnlimitedContractSize: false,
        },
        local: {
            polkavm: true,
            nodeConfig: {
                nodeBinaryPath: 'PATH_TO_POLKADOT_BINARY',
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: 'PATH_TO_ADAPTER_BINARY',
                dev: true,
            },
            accounts: [],
        },
        westend: {
            url: 'wss://westend-rpc.polkadot.io',
            polkavm: true,
            accounts: [process.env.POLKADOT_PRIVATE_KEY || ''],
        },
        sepolia: {
            url: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
        },
        polygon: {
            url: 'wss://polygon-bor-rpc.publicnode.com',
        },
        base: {
            url: 'https://mainnet.base.org',
        },
    },
    resolc: {
        compilerSource: 'npm',
    },
};

export default config;
