import '@nomicfoundation/hardhat-chai-matchers';
import '@parity/hardhat-polkadot';
import '@nomicfoundation/hardhat-ignition';
import { HardhatUserConfig } from 'hardhat/types';

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const config: HardhatUserConfig = {
    solidity: '0.8.28',
    networks: {
        hardhat: {
            allowUnlimitedContractSize: false,
            chainId: 31337,
        },
        // npx hardhat node-polkadot
        local: {
            polkavm: true,
            url: 'http://localhost:8545',
            chainId: 420420420,
        },
        // Polkadot Hub Testnet
        polkadotHubTestnet: {
            polkavm: true,
            url: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
            // faucet: https://faucet.polkadot.io/?parachain=1111
            accounts: !!PRIVATE_KEY
                ? [PRIVATE_KEY]
                : ['271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687'],
            chainId: 420420422,
        },
        // Privacy-focused Live Network
        kusamaHub: {
            polkavm: true,
            url: 'https://kusama-asset-hub-eth-rpc.polkadot.io/',
            // token: https://coinmarketcap.com/currencies/kusama/#Markets
            accounts: !!PRIVATE_KEY ? [PRIVATE_KEY] : [],
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
