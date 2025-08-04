import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        // npx hardhat node
        hardhat: {
            polkavm: true,
            forking: {
                url: "https://testnet-passet-hub.polkadot.io",
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
        },
        local: {
            polkavm: true,
            url: "http://localhost:8545",
        },
    },
}

export default config
