import { defineConfig } from "hardhat/config"
import polkadot from "@parity/hardhat-polkadot"

export default defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        default: {
            allowUnlimitedContractSize: false,
            chainId: 31337,
        },
        polkadotHubTestnet: {
            polkadot: true,
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            chainId: 420420422,
        },
        kusamaHub: {
            polkadot: true,
            url: "https://kusama-asset-hub-eth-rpc.polkadot.io/",
            chainId: 420420418,
        },
        sepolia: {
            url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
            chainId: 11155111,
        },
        polygon: {
            url: "wss://polygon-bor-rpc.publicnode.com",
            chainId: 137,
        },
        base: {
            url: "https://mainnet.base.org",
            chainId: 8453,
        },
    },
})
