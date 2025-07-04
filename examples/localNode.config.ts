import { HardhatUserConfig } from "hardhat/config"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkavm: true,
            nodeConfig: {
                nodeBinaryPath: "path/to/substrate-node/binary",
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "path/to/eth-rpc-adapter",
                dev: true,
            },
        },
    },
    resolc: {
        compilerSource: "binary",
        settings: {
            optimizer: {
                enabled: true,
            },
            compilerPath: "path/to/resolc",
        },
    },
}

export default config
