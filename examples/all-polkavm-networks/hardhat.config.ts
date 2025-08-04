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
        /** Local Network
         * PAPI explorer: https://dev.papi.how/explorer#networkId=localhost&endpoint=http%3A%2F%2Flocalhost%3A8545
         */
        local: {
            polkavm: true,
            url: "http://localhost:8545",
        },
        /** Polkadot Hub Testnet
         * faucet: https://faucet.polkadot.io/?parachain=1111
         * EVM explorer: https://blockscout-passet-hub.parity-testnet.parity.io/
         * Substrate/EVM explorer: https://assethub-paseo.subscan.io/
         * PAPI explorer: https://dev.papi.how/explorer#networkId=passet_hub&endpoint=wss%3A%2F%2Ftestnet-passet-hub.polkadot.io
         */
        polkadotHubTestnet: {
            polkavm: true,
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            accounts: PRIVATE_KEY
                ? [PRIVATE_KEY]
                : ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
            chainId: 420420422,
        },
        /** Kusama - Privacy-focused Live Network
         * token: https://coinmarketcap.com/currencies/kusama/#Markets
         * EVM explorer: https://blockscout-kusama-asset-hub.parity-chains-scw.parity.io/
         * Substrate/EVM explorer: https://assethub-kusama.subscan.io/
         * PAPI explorer: https://dev.papi.how/explorer#networkId=kusama_asset_hub&endpoint=light-client
         */
        kusamaHub: {
            polkavm: true,
            url: "https://kusama-asset-hub-eth-rpc.polkadot.io",
            polkadotUrl: "ws://kusama-asset-hub.polkadot.io",
            accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
            chainId: 420420418,
        },
        /** Internal Parity Testnet
         * faucet: https://faucet.polkadot.io/westend
         * EVM explorer: https://blockscout-asset-hub.parity-chains-scw.parity.io/
         * Substrate/EVM explorer: https://assethub-westend.subscan.io/
         * PAPI explorer: https://dev.papi.how/explorer#networkId=westend_asset_hub&endpoint=light-client
         */
        westendHub: {
            polkavm: true,
            url: "https://westend-asset-hub-eth-rpc.polkadot.io",
            accounts: PRIVATE_KEY
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
