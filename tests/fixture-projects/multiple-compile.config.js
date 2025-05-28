require("@parity/hardhat-polkadot")

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.8.20",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.7.6",
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
                version: "0.8.1",
                settings: {
                    viaIR: false,
                },
            },
        },
    },
}
