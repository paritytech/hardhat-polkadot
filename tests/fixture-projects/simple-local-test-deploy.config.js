require("@nomicfoundation/hardhat-toolbox")
require("@parity/hardhat-polkadot")

module.exports = {
    solidity: "0.8.28",
    resolc: {
        compilerSource: "npm",
    },
    networks: {
        hardhat: {
            polkavm: true,
        },
        localNode: {
            polkavm: true,
            url: `http://127.0.0.1:8545`,
        },
        passetHub: {
            polkavm: true,
            url: "https://testnet-passet-hub.polkadot.io",
            accounts: ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
        },
    },
}
