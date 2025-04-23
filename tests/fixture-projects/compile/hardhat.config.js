require("@parity/hardhat-polkadot")

module.exports = {
    solidity: "0.8.28",
    resolc: {
        version: "1.5.2",
        compilerSource: "npm",
    },
    networks: {
        hardhat: {
            polkavm: true,
        },
    },
}
