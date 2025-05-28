require("@parity/hardhat-polkadot")

module.exports = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkavm: true,
        },
    },
}
