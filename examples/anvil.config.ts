import { HardhatUserConfig } from "hardhat/config"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: {
                target: "evm",
            },
            nodeConfig: {
                useAnvil: true,
                nodeBinaryPath: "<PATH_TO_ANVIL_BIN>",
            },
        },
    },
}

export default config
