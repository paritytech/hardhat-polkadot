const { defineConfig } = require("hardhat/config")
const polkadot = require("@parity/hardhat-polkadot")

module.exports = defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: true,
            docker: true,
            forking: {
                url: "https://testnet-passet-hub.polkadot.io",
            },
        },
        localNode: {
            polkadot: true,
            url: `http://127.0.0.1:8545`,
        },
    },
})
