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
                nodeBinaryPath: "path/to/anvil-polkadot/binary",
            },
        },
    },
}

export default config
