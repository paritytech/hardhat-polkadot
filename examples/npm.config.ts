import { HardhatUserConfig } from "hardhat/config"
import "hardhat-resolc"

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
