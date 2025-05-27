import '@nomicfoundation/hardhat-chai-matchers';
import '@parity/hardhat-polkadot';
import '@nomicfoundation/hardhat-ignition';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            allowUnlimitedContractSize: false,
        },
        mainnet: {
            url: `https://eth.llamarpc.com`,
        },
        arbitrum: {
            url: `wss://arbitrum.callstaticrpc.com`,
        },
        optimism: {
            url: `wss://optimism-rpc.publicnode.com`,
        },
        polygon: {
            url: `wss://polygon-bor-rpc.publicnode.com`,
        },
        bnb: {
            url: `https://binance.llamarpc.com`,
        },
        polkadot: {
            url: `http://127.0.0.1:8545`,
            polkavm: true,
            nodeConfig: {
                nodeBinaryPath: './polkadot-sdk/target/release/substrate-node',
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: './polkadot-sdk/target/release/eth-rpc',
                dev: true,
            },
            accounts: ['0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'],
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
