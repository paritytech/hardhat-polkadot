# hardhat-polkadot-resolc

Polkadot [Hardhat](https://hardhat.org/) plugin to compile Ethereum-compatible Solidity smart contracts.

## Compatibility

- Requires Hardhat v3 (`hardhat@^3.0.0`).
- Not compatible with Solidity versions lower than `0.8.0`.

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

1. Import the plugin and use `defineConfig` in your `hardhat.config.ts`:

```ts
import { defineConfig } from "hardhat/config"
import polkadot from "@parity/hardhat-polkadot"

export default defineConfig({
    plugins: [polkadot],
    solidity: "0.8.28",
    resolc: {
        version: "latest",
        compilerSource: "binary",
        settings: {
            optimizer: {
                enabled: true,
                parameters: "3",
            },
        },
    },
})
```

2. Configure `resolc` in `hardhat.config.ts` according to [available options](./src/types.ts#L15).

### Usage

Compile Solidity smart contracts for the Polkadot network, creating Polkadot-compatible Hardhat artifacts.

```sh
$ npx hardhat compile
```

## Happy building! 👷‍♀️👷‍♂️
