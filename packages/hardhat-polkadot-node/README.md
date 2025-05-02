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

Run a local Polkadot from a binary and initializes a JSON-RPC server.  

```bash
$ npx hardhat node
\ --node-binary-path /path/to/node 
\ --adapter-binary-path /path/to/adapter
```

Run a fork of a live Polkadot chain and initializes a JSON-RPC.

```bash
$ npx hardhat node --fork wss://asset-hub-westend-rpc.dwellir.com 
\ --adapter-binary-path /path/to/adapter
```

| 🔧 Command                          | 📄 Description                                                                                                       |
|-------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| --rpc-port                          | Port on which the server should listen. Defaults to 8000.                                                            |
| --node-binary-path                  | Path to the substrate node binary.                                                                                   |
| --adapter-endpoint                  | Endpoint to which the adapter will connect to. Defaults to ws://localhost:8000.                                      |
| --adapter-binary-path               | Path to the eth-rpc-adapter binary.                                                                                  |
| --adapter-port                      | Port on which the adapter will listen to. Defaults to 8545.                                                          |
| --dev                               | Whether to run the fork in dev mode. Defaults to false.                                                              |
| --build-block-mode                  | Build block mode for chopsticks.                                                                                     |
| --fork                              | Endpoint of the chain to fork.                                                                                       |
| --fork-block-number                 | Block hash or block number from where to fork.                                                                       |

## Happy building! 👷‍♀️👷‍♂️