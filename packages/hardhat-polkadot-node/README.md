# hardhat-polkadot-node

Polkadot [Hardhat](https://hardhat.org/) plugin to run a local Polkadot-compatible node.

## Compatibility

- Requires Hardhat v3 (`hardhat@^3.0.0`).
- Widely compatible with Hardhat helpers, with caveats such as `loadFixture` from `@nomicfoundation/hardhat-toolbox/network-helpers`.

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

1. Import the plugin and use `defineConfig` in your `hardhat.config`:

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

2. Configure a Polkadot-compatible node and ETH-RPC adapter in your `hardhat.config` according to [available options](./src/type-extensions.ts#L4).

### Node Config Options

| Option | Type | Description |
|--------|------|-------------|
| `useAnvil` | `boolean` | Use `anvil-polkadot` as the node (default: `true`) |
| `nodeBinaryPath` | `string` | Path to the substrate node binary |
| `rpcPort` | `number` | ETH-RPC adapter port |
| `dev` | `boolean` | Enable node in development mode |
| `consensus` | `object` | Only if using `revive-dev-node` — `{ seal, period }` |

### Adapter Config Options

| Option | Type | Description |
|--------|------|-------------|
| `adapterBinaryPath` | `string` | Path to the ETH-RPC adapter binary |
| `adapterPort` | `number` | Port where the adapter will listen (default: `8545`) |
| `dev` | `boolean` | Whether to run the adapter in dev mode (default: `false`) |
| `buildBlockMode` | `"Instant" \| "Manual" \| "Batch"` | Build block mode when forking |

### Docker Support

Set `docker: true` to use Docker instead of local binaries, or provide a custom socket path as a string.

## Usage

### From `hardhat.config`

See [Examples](../../examples/).

**NOTE**: When the `forking` field is used, the path to the `eth-rpc` must be provided, even if `useAnvil` is set to `true`, since `anvil-polkadot` has no forking functionality yet.

## Happy building! 👷‍♀️👷‍♂️
