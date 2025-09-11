require("@nomicfoundation/hardhat-toolbox")
require("@parity/hardhat-polkadot")

module.exports = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: true,
            docker: true,
        },
        localNode: {
            polkadot: true,
            url: `http://127.0.0.1:8545`,
        },
    },
}
