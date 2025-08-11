<div align="center">

# Hardhat plugin for smart contracts on Polkadot

<div align="center" >
  <a href="https://polkadot.com" target="_blank">
    <img height="70px" alt="Polkadot Logo Light" src="https://github.com/paritytech/polkadot-sdk/raw/master/docs/images/Polkadot_Logo_Horizontal_Pink_Black.png#gh-light-mode-only" />
  </a>
  <a href="https://hardhat.org" target="_blank">
    <img height="60px" alt="Hardhat Logo Light" src="https://hardhat.org/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhardhat-logo.5c5f687b.svg&w=384&q=75" />
  </a>
</div>

</div>

## Compatibility

- Not compatible with solidity versions lower than `0.8.0`.

## Installation

Using npm:

```bash
$ npm install -D @parity/hardhat-polkadot
```

Using yarn:

```bash
$ yarn add -D @parity/hardhat-polkadot 
```

Using pnpm:

```bash
$ pnpm add -D @parity/hardhat-polkadot 
```

## Configuration

1. Import the package in the `hardhat.config.ts` file:

```js
...
import "@parity/hardhat-polkadot";
...
```

2. Create 2 binaries - One for the node and another for the ETH-RPC adapter. See step **1.** of [Deploying with a Local Node](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#deploying-with-a-local-node).

3. Example configuration in `hardhat.config.ts`

```js
const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      polkavm: true,
      nodeConfig: {
        nodeBinaryPath: 'INSERT_PATH_TO_SUBSTRATE_NODE',
        rpcPort: 8000,
        dev: true,
      },
      adapterConfig: {
        adapterBinaryPath: 'INSERT_PATH_TO_ETH_RPC_ADAPTER',
        dev: true,
      },
    },
  },
  resolc: {
    compilerSource: "npm",
  },
};
```

## Usage

Get started from a boilerplate.

```bash
$ npx hardhat-polkadot init
```

Compile solidity smart contracts for the Polkadot network, creating PolkaVM compatible hardhat artifacts.

```bash
$ npx hardhat compile
```

Test smart contracts locally. See more in [Testing Your Contract](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#testing-your-contract).

```bash
$ npx hardhat test
```

Deploy smart contracts locally or to a Live Network. See more in [Deploying with a Local Node](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#deploying-with-a-local-node) and [Deploying to a live Network](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#deploying-to-a-live-network).

```bash
$ npx hardhat ignition deploy ./ignition/modules/deploy.js
```

Run custom scripts locally or on a Live Network. See more in [Interacting with Your Contract](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#interacting-with-your-contract).

```bash
$ npx hardhat run scripts/interact.js
```

## Documentation

* See [Examples](https://github.com/paritytech/hardhat-polkadot/tree/main/examples)

* Get started from scratch with [How to use Hardhat with Polkadot](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/)

* Follow tutorial with [Test and Deploy with Hardhat](https://papermoonio.github.io/polkadot-mkdocs/tutorials/smart-contracts/launch-your-first-project/test-and-deploy-with-hardhat/)

## Getting Help

* [Discord # solidity-smart-contracts](https://discord.com/channels/722223075629727774/1316832344748986398)
* [Website](https://polkadot.com/)
* [GitHub](https://github.com/paritytech)

## Happy building! 👷‍♀️👷‍♂️
