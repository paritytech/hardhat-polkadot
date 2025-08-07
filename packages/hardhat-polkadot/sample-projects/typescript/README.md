# Sample Polkadot Hardhat Project

This project demonstrates how to use Hardhat with Polkadot. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

1) Create a binary of the [`eth-rpc`](https://github.com/paritytech/polkadot-sdk/tree/master/substrate/frame/revive/rpc) and the `substrate-node` and move them to the `bin` folder at the root of your project. Alternatively, update your configuration file to point to your local binary. For instructions, check [Polkadot Hardhat docs](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#testing-your-contract).

2) Try running some of the following tasks:

```shell
npx hardhat compile
npx hardhat test
npx hardhat node
npx hardhat node && npx hardhat ignition deploy ./ignition/modules/MyToken.js --network localhost
```
