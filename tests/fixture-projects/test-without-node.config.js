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
            adapterConfig: {
                adapterBinaryPath: "../bin/eth-rpc.sh", // relative to project
                dev: true,
                buildBlockMode: "Instant",
            },
            nodeConfig: {
                nodeBinaryPath: "../bin/substrate-node.sh", // relative to project
                rpcPort: 8000,
                dev: true,
            },
        },
    },
}
