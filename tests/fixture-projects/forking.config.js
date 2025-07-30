require("@nomicfoundation/hardhat-toolbox")
require("@parity/hardhat-polkadot")

module.exports = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkavm: true,
            docker: true,
            forking: {
                url: "https://testnet-passet-hub.polkadot.io",
            },
        },
    },
}
