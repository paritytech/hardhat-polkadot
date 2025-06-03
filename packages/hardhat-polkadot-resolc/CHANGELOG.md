# Changelog

## 0.1.4 (2025-06-03)
### Bug Fixes

- Compile contracts only if `polkavm` is enabled. ([#157](https://github.com/paritytech/hardhat-polkadot/pull/157)) ([39b38a2](https://github.com/paritytech/hardhat-polkadot/commit/39b38a25f03b4ce4f71b046ede6467fb10109768))
- Avoid compiling cached artifacts. ([#149](https://github.com/paritytech/hardhat-polkadot/pull/149)) ([6842361](https://github.com/paritytech/hardhat-polkadot/commit/6842361f6135c0ef3006ad08390215bdd4e854cd))
- Fix `solc` incompatibility between `@parity/hardhat-polkadot-resolc` and `@parity/resolc`. ([#148](https://github.com/paritytech/hardhat-polkadot/pull/148)) ([0a85981](https://github.com/paritytech/hardhat-polkadot/commit/0a85981e4b261f4d3eaf4d577047ab706076fafd))

### Chores

- Add solc as dependency. ([#133](https://github.com/paritytech/hardhat-polkadot/pull/133)) ([21ae755](https://github.com/paritytech/hardhat-polkadot/commit/21ae7556cc42a8968a3311f30a9faf23f3c9d0e5))


## 0.1.3 (2025-05-13)
### Chores

- Rollback hardhat to `<v2.23.0`. ((#120)[https://github.com/paritytech/hardhat-polkadot/pull/120]) ((765a0cc)[https://github.com/paritytech/hardhat-polkadot/commit/765a0cc3e0c797d8ccb1f68748671fbde46487b7])
- Bump `hardhat` to `2.24.0`. ([#119](https://github.com/paritytech/hardhat-polkadot/pull/119)) ([acb889b](https://github.com/paritytech/hardhat-polkadot/commit/acb889b253b310f642a8de7312ca97e70e8096d1))


## 0.1.2 (2025-05-08)
### Bug Fixes

- Updated npm optimization input. ([#113](https://github.com/paritytech/hardhat-polkadot/pull/113)) ([7055ff1](https://github.com/paritytech/hardhat-polkadot/commit/7055ff11553ee24c8a024f4959d3c7d000ddbf35))

### Chores

- Updates `@parity/resolc` to enable inputting optimization settings to npm compiler. ([#111](https://github.com/paritytech/hardhat-polkadot/pull/111)) ([65c38ed](https://github.com/paritytech/hardhat-polkadot/commit/65c38ed417f150bcceabe92678cd9df8e6369c06))


## 0.1.1 (2025-05-08)
### Bug Fixes

- Binds `solc` to 0.8.29 to avoid `Error: solc versions >0.8.29 are not supported, found 0.8.30`. ([#107](https://github.com/paritytech/hardhat-polkadot/pull/107)) ([2a29715](https://github.com/paritytech/hardhat-polkadot/commit/2a29715b636b5e72ecb0f96f2be1f51a0ee13232))
