require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  resolc: {
    compilerSource: 'npm',
  },
  networks: {
    hardhat: {
      polkavm: true,
      forking: {
        url: 'wss://westend-asset-hub-rpc.polkadot.io',
      },
    },
  }
};
