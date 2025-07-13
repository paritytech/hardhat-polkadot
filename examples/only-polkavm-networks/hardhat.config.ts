import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    resolc: {
        compilerSource: "npm",
    },
    networks: {
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
        // Official Polkadot Asset Hub Testnet
        passet: {
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            polkavm: true,
            accounts: [process.env.POLKADOT_PRIVATE_KEY || '271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687'],
            // Token: PAS
            // Block explorer URL: https://blockscout-passet-hub.parity-testnet.parity.io/
            // Faucet: https://faucet.polkadot.io/?parachain=1111
        },

        // Westend Asset Hub
        westend: {
            url: "https://westend-asset-hub-eth-rpc.polkadot.io",
            polkavm: true,
            accounts: [process.env.POLKADOT_PRIVATE_KEY || '271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687'],
            // Token: WND
            // Block explorer URL: https://westend.subscan.io/
            // Faucet: https://faucet.polkadot.io/westend
        },
    },
}

export default config
