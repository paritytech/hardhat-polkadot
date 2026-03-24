<div align="center">

  # Build on Polkadot with Hardhat Plugin

  <div>
    <a href="https://polkadot.com" target="_blank">
      <img height="70px" alt="Polkadot Logo Light" src="https://github.com/paritytech/polkadot-sdk/raw/master/docs/images/Polkadot_Logo_Horizontal_Pink_Black.png#gh-light-mode-only" />
    </a>
  </div>
  <div>
    <a href="https://hardhat.org" target="_blank">
      <img width="250" alt="Hardhat Logo Light" src="https://hardhat.org/images/hardhat-logo.svg" />
    </a>
  </div>
  <br>
</div>

## Compatibility

- Requires Hardhat v3 (`hardhat@^3.0.0`).
- Not compatible with Solidity versions lower than `0.8.0`.

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

1. Import the plugin and use `defineConfig` in your `hardhat.config.ts`:

```ts
import { defineConfig } from "hardhat/config"
import polkadot from "@parity/hardhat-polkadot"

export default defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkadot: true,
            nodeConfig: {
                useAnvil: true,
                nodeBinaryPath: "./bin/anvil-polkadot",
            },
        },
    },
})
```

Or for CommonJS projects:

```js
const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      polkadot: true,
      nodeConfig: {
        nodeBinaryPath: 'INSERT_PATH_TO_ANVIL_NODE',
      },
    },
  },
};
```

## Usage

Get started from a boilerplate:

```bash
$ npx hardhat-polkadot init
```

Port an existing Hardhat project to Polkadot (upgrades to Hardhat v3 if needed):

```bash
$ npx hardhat-polkadot port <project-dir>
```

Compile Solidity smart contracts for the Polkadot network:

```bash
$ npx hardhat compile
```

Test smart contracts locally. See more in [Testing Your Contract](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#testing-your-contract).

```bash
$ npx hardhat test
```

Deploy smart contracts locally or to a live network. See more in [Deploying with a Local Node](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#deploying-with-a-local-node) and [Deploying to a Live Network](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#deploying-to-a-live-network).

```bash
$ npx hardhat ignition deploy ./ignition/modules/deploy.js
```

Run custom scripts locally or on a live network. See more in [Interacting with Your Contract](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/#interacting-with-your-contract).

```bash
$ npx hardhat run scripts/interact.js
```

## Documentation

* See [Examples](../../examples)

* Get started from scratch with [How to use Hardhat with Polkadot](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/)

* Follow tutorial with [Test and Deploy with Hardhat](https://papermoonio.github.io/polkadot-mkdocs/tutorials/smart-contracts/launch-your-first-project/test-and-deploy-with-hardhat/)

## Getting Help

* [Discord # solidity-smart-contracts](https://discord.com/channels/722223075629727774/1316832344748986398)
* [Website](https://polkadot.com/)
* [GitHub](https://github.com/paritytech)

## Happy building! 👷‍♀️👷‍♂️
