require("@nomicfoundation/hardhat-toolbox");
require("hardhat-polkadot");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    substrate: {
      url: process.env.SUBSTRATE_RPC_URL || "http://localhost:9933",
      chainId: 42,
      accounts: {
        mnemonic: process.env.MNEMONIC || "bottom drive obey lake curtain smoke basket hold race lonely fit walk",
      },
    },
    // Alternative configuration for Docker container
    "substrate-docker": {
      url: "http://localhost:9933",
      chainId: 42,
      accounts: {
        mnemonic: "bottom drive obey lake curtain smoke basket hold race lonely fit walk",
      },
    },
  },
  // Console.log handler configuration
  consoleHandler: {
    enabled: true,
    colorOutput: true,
    captureEvents: true,
  }
};