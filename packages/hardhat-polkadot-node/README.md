# hardhat-polkadot-node

Polkadot [Hardhat](https://hardhat.org/) plugin to run a mock in-memory node.

## Compatibility

- Not compatible with hardhat-only helpers, such as `time` and `loadFixture` from `@nomicfoundation/hardhat-toolbox/network-helpers`

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

Import the package in the `hardhat.config.ts` file:

```js
...
import "@parity/hardhat-polkadot-node";
...
```

## Usage

### From `hardhat.config`

Configure a PolkaVM-compatible node and eth-rpc in `hardhat.config.js` according to [available options](https://github.com/paritytech/hardhat-polkadot/blob/ebb5b48bd8bc6f9d8906d8223736f8a8f7e2724f/packages/hardhat-polkadot-node/src/type-extensions.ts#L5). 

See [Examples](https://github.com/paritytech/hardhat-polkadot/tree/main/examples).

### From the CLI

Run a local Polkadot from a binary and initializes a JSON-RPC server.

```bash
$ npx hardhat node
\ --node-binary-path /path/to/node
\ --adapter-binary-path /path/to/adapter
```

Run a fork of a live Polkadot chain and initializes a JSON-RPC.

```bash
$ npx hardhat node --fork https://testnet-passet-hub.polkadot.io
\ --adapter-binary-path /path/to/adapter
```

| 🔧 Command | 📄 Description |
| --- | --- |
| --rpc-port | Port on which the server should listen. Defaults to 8000. It is also where the adapter will connect to when using the binaries. |
| --node-binary-path | Path to the substrate node binary. |
| --adapter-binary-path | Path to the eth-rpc-adapter binary. |
| --adapter-port | Port on which the adapter will listen to. Defaults to 8545. |
| --dev | Whether to run the fork in dev mode. Defaults to false. |
| --build-block-mode | Build block mode for chopsticks. |
| --fork | Endpoint of the chain to fork. |
| --fork-block-number | Block hash or block number from where to fork. |


## Happy building! 👷‍♀️👷‍♂️
