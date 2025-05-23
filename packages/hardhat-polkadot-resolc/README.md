# hardhat-polkadot-resolc

Polkadot [Hardhat](https://hardhat.org/) plugin to compile Ethereum-compatible solidity smart contracts.

## Compatibility

- Not compatible with solidity versions lower than `0.8.0`.

## Installation

Using npm:

```bash
$ npm install -D @parity/hardhat-polkadot-resolc
```

Using yarn:

```bash
$ yarn add -D @parity/hardhat-polkadot-resolc
```

Using pnpm:

```bash
$ pnpm add -D @parity/hardhat-polkadot-resolc
```

## Configuration

1. Import the package in the `hardhat.config.ts` file:

```js
...
import "@parity/hardhat-polkadot-resolc";
...
```

2. Configure resolc in `hardhat.config.ts` according to [available options](https://github.com/paritytech/hardhat-polkadot/blob/042fe22ef9ad3a00a632c33576476374888d425a/packages/hardhat-polkadot-resolc/src/types.ts#L26).

### Usage

Compile solidity smart contracts for the Polkadot network, creating PolkaVM compatible hardhat artifacts.

```sh
$ npx hardhat compile
```

## Happy building! 👷‍♀️👷‍♂️
