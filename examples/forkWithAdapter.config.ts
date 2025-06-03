import { HardhatUserConfig } from "hardhat/config"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.26",
    networks: {
        hardhat: {
            polkavm: true,
            forking: {
                url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            },
            accounts: [
                {
                    privateKey: "PRIVATE_KEY",
                    balance: "10000000000",
                },
            ],
            adapterConfig: {
                adapterBinaryPath: "path/to/adapter/binary",
                dev: true,
            },
        },
    },
    resolc: {
        compilerSource: "npm",
    },
}

export default config
