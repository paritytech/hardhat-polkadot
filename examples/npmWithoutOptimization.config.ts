import { HardhatUserConfig } from "hardhat/config"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkavm: true,
        },
    },
    resolc: {
        compilerSource: "npm",
    },
}

export default config
