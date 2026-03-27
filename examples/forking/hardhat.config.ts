import { defineConfig } from "hardhat/config"
import polkadot from "@parity/hardhat-polkadot"

export default defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        // npx hardhat node
        default: {
            polkadot: {
                target: "evm",
            },
            forking: {
                url: "https://testnet-passet-hub.polkadot.io",
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
        },
        local: {
            polkadot: true,
            url: "http://localhost:8545",
        },
    },
})
