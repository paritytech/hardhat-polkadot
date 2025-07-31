import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@parity/hardhat-polkadot"

const PRIVATE_KEY = process.env.PRIVATE_KEY

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        polkadotHubTestnet: {
            polkavm: true,
            url: "https://testnet-passet-hub-eth-rpc.polkadot.io",
            accounts: PRIVATE_KEY
                ? [PRIVATE_KEY]
                : ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
            chainId: 420420422,
        },
    },
}

export const TEST_NETWORKS = ["polkadotHubTestnet"]
export default config
