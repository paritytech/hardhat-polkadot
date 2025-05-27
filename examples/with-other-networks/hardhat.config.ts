import '@nomicfoundation/hardhat-chai-matchers';
import '@parity/hardhat-polkadot';
import '@nomicfoundation/hardhat-ignition';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            allowUnlimitedContractSize: false,
        },
        local: {
            url: 'URL_TO_POLKADOT_RPC',
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
            nodeConfig: {
                nodeBinaryPath: 'PATH_TO_POLKADOT_BINARY',
                rpcPort: 9944,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: 'PATH_TO_ADAPTER_BINARY',
                dev: true,
            },
            accounts: [],
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
    solidity: {
        version: '0.8.28',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    resolc: {
        version: '1.5.2',
        compilerSource: 'npm',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
};

export default config;
