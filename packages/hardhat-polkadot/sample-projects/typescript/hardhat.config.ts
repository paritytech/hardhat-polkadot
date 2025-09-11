import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: true,
            nodeConfig: {
                nodeBinaryPath: "./bin/dev-node",
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
        },
        localNode: {
            polkadot: true,
            url: `http://127.0.0.1:8545`,
        },
        polkadotHubTestnet: {
            polkadot: true,
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            accounts: [vars.get("PRIVATE_KEY")],
        },
    },
}

export default config
