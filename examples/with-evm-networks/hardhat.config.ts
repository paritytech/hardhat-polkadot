import '@nomicfoundation/hardhat-chai-matchers';
import '@parity/hardhat-polkadot';
import '@nomicfoundation/hardhat-ignition';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    solidity: '0.8.28',
    networks: {
        hardhat: {
            allowUnlimitedContractSize: false,
            chainId: 31337,
        },
        polkadotHubTestnet: {
            polkavm: true,
            url: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
            chainId: 420420422,
        },
        kusamaHub: {
            polkavm: true,
            url: 'https://kusama-asset-hub-eth-rpc.polkadot.io/',
            chainId: 420420418,
        },
        sepolia: {
            url: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
            chainId: 11155111,
        },
        polygon: {
            url: 'wss://polygon-bor-rpc.publicnode.com',
            chainId: 137,
        },
        base: {
            url: 'https://mainnet.base.org',
            chainId: 8453,
        },
    },
    resolc: {
        compilerSource: 'npm',
    },
};

export default config;
