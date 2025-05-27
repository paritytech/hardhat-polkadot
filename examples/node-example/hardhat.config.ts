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
