require("@parity/hardhat-polkadot")

module.exports = {
    solidity: "0.8.28",
    resolc: {
        version: "1.5.2",
        compilerSource: "npm",
    },
networks: {
        polkavm: true,
        forking: {
            url: 'wss://westend-asset-hub-rpc.polkadot.io',
        },
        accounts: [{
            privateKey: process.env.PRIVATE_KEY,
            balance: '10000000000'
        }],
        adapterConfig: {
            adapterBinaryPath: '/Users/tiago/Projects/polkadot-sdk/target/release/eth-rpc',
            dev: true
        }
}
}
