# Examples of using Hardhat with Polkadot

These examples use Hardhat v3 with the `defineConfig` and `plugins` API.

To know more about how to configure the compiler, take a look at the [@parity/hardhat-polkadot-resolc configuration section](https://github.com/paritytech/hardhat-polkadot/tree/main/packages/hardhat-polkadot-resolc#configuration).

To know more about how to configure and use the local node, take a look at the [@parity/hardhat-polkadot-node configuration section](https://github.com/paritytech/hardhat-polkadot/tree/main/packages/hardhat-polkadot-node#configuration) and/or run `npx hardhat node-polkadot --help`.

To port an existing Hardhat project to Polkadot (upgrades to Hardhat v3 if needed), use the migrator:

```bash
$ npx hardhat-polkadot port <project-dir>
```
