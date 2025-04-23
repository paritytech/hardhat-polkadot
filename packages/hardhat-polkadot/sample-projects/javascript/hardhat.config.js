require('@nomicfoundation/hardhat-toolbox');
require('@parity/hardhat-polkadot');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: '0.8.28',
    resolc: {
        compilerSource: 'npm',
    },
    networks: {
        hardhat: {
            polkavm: true,
            forking: {
                url: 'wss://westend-asset-hub-rpc.polkadot.io',
            },
            adapterConfig: {
                adapterBinaryPath: './bin/eth-rpc',
                dev: true,
            },
        },
    }
};
