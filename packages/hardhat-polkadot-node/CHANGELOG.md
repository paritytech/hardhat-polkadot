# Changelog

## 0.1.2 (2025-06/03)
### Bug fixes

- Remove check for node and adapter path to decide if we wait for the port to be ready or not. ([#159](https://github.com/paritytech/hardhat-polkadot/pull/159)) ([172515b](https://github.com/paritytech/hardhat-polkadot/commit/172515b0c8bea891123d74208fd07f56cffb974b))
- RPC server using Docker breaks forking. ([#158](https://github.com/paritytech/hardhat-polkadot/pull/158)) ([b97ed7b](https://github.com/paritytech/hardhat-polkadot/commit/b97ed7b59efca4c724641a0ece239617dba49160))
- Deprecate `adapterEndpoint`. ([#151](https://github.com/paritytech/hardhat-polkadot/pull/151)) ([7f007da](https://github.com/paritytech/hardhat-polkadot/commit/7f007daf7a38f3f5eff84829d3a3a02e5cca1d1f))


## 0.1.1 (2025-05-08)
### Bug Fixes

- Default `buildBlockMode` to `Instant` when forking. ([#104](https://github.com/paritytech/hardhat-polkadot/pull/104)) ([d2989d1](https://github.com/paritytech/hardhat-polkadot/commit/d2989d153365b2ee7a6d84e3f25fc2dc285b6624))
- Fix chopsticks commands not being parsed. ([#101](https://github.com/paritytech/hardhat-polkadot/pull/101)) ([eebf1aa](https://github.com/paritytech/hardhat-polkadot/commit/eebf1aa44c303d90184ac4f37536cd6f14979ab8))
