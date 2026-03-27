import { defineConfig } from "hardhat/config"
import polkadot from "@parity/hardhat-polkadot"

export default defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        default: {
            polkadot: {
                target: "evm",
            },
            nodeConfig: {
                useAnvil: true,
                nodeBinaryPath: "<PATH_TO_ANVIL_BIN>",
            },
        },
    },
})
