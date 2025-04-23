# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

You should have a binary of the [`eth-rpc-adapter`](https://github.com/paritytech/polkadot-sdk/tree/master/substrate/frame/revive/rpc) located in the `bin` folder at
the root of your project, or update your configuration file's `adapterConfig.adapterBinaryPath` to point to your local binary.

Try running some of the following tasks:

```shell
npx hardhat test
npx hardhat node
npx hardhat node && npx hardhat ignition deploy ./ignition/modules/MyToken.js --network localhost
```
