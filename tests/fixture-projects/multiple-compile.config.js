const { defineConfig } = require("hardhat/config")
const polkadot = require("@parity/hardhat-polkadot")

module.exports = defineConfig({
    plugins: [polkadot],
    solidity: {
        compilers: [
            {
                version: "0.8.2",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.3",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 9999,
                    },
                },
            },
        ],
        overrides: {
            "contracts/Foo.sol": {
                version: "0.8.4",
                settings: {
                    viaIR: false,
                },
            },
        },
    },
})
