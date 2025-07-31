import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    // npx hardhat node
    networks: {
        hardhat: {
            polkavm: true,
            forking: {
                url: "https://testnet-passet-hub.polkadot.io",
            },
            adapterConfig: {
                adapterBinaryPath: "/Users/tiago/Projects/polkadot-sdk/target/production/eth-rpc",
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
