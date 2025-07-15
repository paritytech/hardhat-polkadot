import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"

const PRIVATE_KEY = process.env.PRIVATE_KEY

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    resolc: {
        compilerSource: "npm",
    },
    networks: {
        // npx hardhat node
        hardhat: {
            polkavm: true,
            nodeConfig: {
                nodeBinaryPath: "./bin/substrate-node",
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
        },
        local: {
            polkavm: true,
            url: "http://localhost:8545",
            chainId: 420420420,
        },
        // Polkadot Hub Testnet
        polkadotHubTestnet: {
            polkavm: true,
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            // faucet: https://faucet.polkadot.io/?parachain=1111
            accounts: !!PRIVATE_KEY
                ? [PRIVATE_KEY]
                : ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
            // block explorer: https://blockscout-passet-hub.parity-testnet.parity.io/
        },
        // Privacy-focused Live Network
        kusamaHub: {
            polkavm: true,
            url: "https://kusama-asset-hub-eth-rpc.polkadot.io",
            // token: https://coinmarketcap.com/currencies/kusama/#Markets
            accounts: [PRIVATE_KEY || ""],
            // block explorer: https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/
        },
        // Internal Parity Testnet
        westendHub: {
            polkavm: true,
            url: "https://westend-asset-hub-eth-rpc.polkadot.io",
            // faucet: https://faucet.polkadot.io/westend
            accounts: !!PRIVATE_KEY
                ? [PRIVATE_KEY]
                : ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
            // block explorer: https://blockscout-asset-hub.parity-chains-scw.parity.io/
        },
        // (Coming Soon)
        // polkadotHub: {
        //     polkavm: true,
        // },
    },
}

export default config
