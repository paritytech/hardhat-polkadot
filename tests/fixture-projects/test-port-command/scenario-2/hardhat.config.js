require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")
require("solidity-coverage")
require("solidity-docgen")
require("hardhat-contract-sizer")

const env = process.env.ENV || "testnet"
const { importNetworks, readJSON } = require("@axelar-network/axelar-chains-config")
const chains = require(`@axelar-network/axelar-chains-config/info/${env}.json`)
const keys = readJSON(`${__dirname}/keys.json`)
const { networks, etherscan } = importNetworks(chains, keys)

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.8.27",
    defaultNetwork: "hardhat",
    networks,
    etherscan,
    mocha: {
        timeout: 1000000,
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        excludeContracts: ["contracts/test"],
    },
    contractSizer: {
        runOnCompile: process.env.CHECK_CONTRACT_SIZE,
        strict: process.env.CHECK_CONTRACT_SIZE,
        except: ["contracts/test"],
    },
    docgen: {
        path: "docs",
        clear: true,
        pages: "files",
    },
}
