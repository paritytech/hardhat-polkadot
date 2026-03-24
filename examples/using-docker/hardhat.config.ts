import { defineConfig } from "hardhat/config"
import polkadot from "@parity/hardhat-polkadot"

export default defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: true,
            // see https://github.com/paritytech/hardhat-polkadot/blob/500cba0310fad38cf01cc7b11cb2e4043bd71482/packages/hardhat-polkadot-node/src/type-extensions.ts#L33
            docker: true,
        },
    },
})
