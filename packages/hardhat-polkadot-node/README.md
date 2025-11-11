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

**NOTE**: When the `forking` field is used, the path to the `eth-rpc` must be provided, even if `useAnvil` is set to `true`, since `anvil-polkadot` has no forking functionality yet. 

## Happy building! 👷‍♀️👷‍♂️
