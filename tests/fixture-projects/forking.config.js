require("@parity/hardhat-polkadot")

module.exports = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkavm: true,
            forking: {
                url: "https://testnet-passet-hub.polkadot.io",
            },
            accounts: ["271ad9a5e1e0178acebdb572f8755aac3463d863ddfc70e32e7d5eb0b334e687"],
            docker: true,
        },
    },
}
