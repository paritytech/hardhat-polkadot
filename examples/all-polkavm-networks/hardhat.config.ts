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
        },
        /** Polkadot Hub Testnet
         * faucet: https://faucet.polkadot.io/?parachain=1111
         * blockscout explorer: https://blockscout-passet-hub.parity-testnet.parity.io/
         * subscan explorer: https://assethub-paseo.subscan.io/
         */
        polkadotHubTestnet: {
            polkavm: true,
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            accounts: !!PRIVATE_KEY
                ? [PRIVATE_KEY]
                : ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
            chainId: 420420422,
        },
        /** Kusama - Privacy-focused Live Network
         * token: https://coinmarketcap.com/currencies/kusama/#Markets
         * blockscout explorer: https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/
         * subscan explorer: https://assethub-kusama.subscan.io/
         */
        kusamaHub: {
            polkavm: true,
            url: "https://kusama-asset-hub-eth-rpc.polkadot.io",
            accounts: !!PRIVATE_KEY ? [PRIVATE_KEY] : [],
            chainId: 420420418,
        },
        /** Internal Parity Testnet
         * faucet: https://faucet.polkadot.io/westend
         * blockscout explorer: https://blockscout-asset-hub.parity-chains-scw.parity.io/
         * subscan explorer: https://assethub-westend.subscan.io/
         */
        westendHub: {
            polkavm: true,
            url: "https://westend-asset-hub-eth-rpc.polkadot.io",
            accounts: !!PRIVATE_KEY
                ? [PRIVATE_KEY]
                : ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
            chainId: 420420421,
        },
        /** Polkadot Hub (Coming Soon)
         * token: https://coinmarketcap.com/currencies/polkadot/#Markets
         */
        // polkadotHub: {
        //     polkavm: true,
        // },
    },
}

export default config
