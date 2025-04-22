import "@parity/hardhat-polkadot"

const config = {
    solidity: "0.8.28",
    resolc: {
        version: "1.5.2",
        compilerSource: "Npm",
    },
    networks: {
        hardhat: {
            polkavm: true,
        },
    },
}

export default config
