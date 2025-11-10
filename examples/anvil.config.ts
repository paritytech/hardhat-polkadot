import { HardhatUserConfig } from "hardhat/config"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: true,
            nodeConfig: {
                useAnvil: true,
                nodeBinaryPath: "<PATH_TO_ANVIL_BIN>",
                dev: true,
                rpcPort: 8000,
                consensus: {
                    seal: "manual-seal",
                },
            },
        },
    },
}

export default config
