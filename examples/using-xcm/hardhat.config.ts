import { defineConfig } from "hardhat/config"
import polkadot from "@parity/hardhat-polkadot"

const PRIVATE_KEY = process.env.PRIVATE_KEY

export const TEST_NETWORKS = ["polkadotHubTestnet"]

export default defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        polkadotHubTestnet: {
            polkadot: true,
            url: "https://services.polkadothub-rpc.com/testnet",
            accounts: PRIVATE_KEY
                ? [PRIVATE_KEY]
                : ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
            chainId: 420420422,
        },
    },
})
