import { defineConfig } from "hardhat/config"
import polkadot from "@parity/hardhat-polkadot"

export default defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        default: {
            polkadot: true,
            docker: true,
            forking: {
                url: "https://testnet-passet-hub.polkadot.io",
            },
        },
        localNode: {
            polkadot: true,
            url: "http://127.0.0.1:8545",
        },
    },
})
