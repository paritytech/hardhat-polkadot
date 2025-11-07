# hardhat-polkadot-node

Polkadot [Hardhat](https://hardhat.org/) plugin to run a mock in-memory node.

## Compatibility

- Widely compatible with hardhat-only helpers, with caveats such as `loadFixture` from `@nomicfoundation/hardhat-toolbox/network-helpers`

## Installation

Using npm:

```bash
$ npm install -D @parity/hardhat-polkadot-node
```

Using yarn:

```bash
$ yarn add -D @parity/hardhat-polkadot-node
```

Using pnpm:

```bash
$ pnpm add -D @parity/hardhat-polkadot-node
```

## Configuration

1. Import the package in the `hardhat.config` file:

```js
...
import "@parity/hardhat-polkadot-node";
...
```

2. Configure a Polkadot-compatible node and eth-rpc in `hardhat.config` according to [available options](./src/type-extensions.ts#L4). 

## Usage

### From `hardhat.config`

See [Examples](../../examples/).

## Happy building! 👷‍♀️👷‍♂️
