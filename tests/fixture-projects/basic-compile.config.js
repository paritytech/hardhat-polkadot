const { defineConfig } = require("hardhat/config")
const polkadot = require("@parity/hardhat-polkadot")

module.exports = defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: true,
        },
    },
})
