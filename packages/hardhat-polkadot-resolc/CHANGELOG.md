# Changelog

## 0.1.6-p0 (2025-07-17)
### Chores

- Bump hardhat to 2.26.0 ([#235](https://github.com/paritytech/hardhat-polkadot/pull/235)) ([89efa94](https://github.com/paritytech/hardhat-polkadot/commit/89efa9498cbe16e32a97519a40a8e1ce4b915f08))

## 0.1.6 (2025-07-04)
### Bug Fixes

- Cleanup compiler version warning. ([#212](https://github.com/paritytech/hardhat-polkadot/pull/212)) ([6b51352](https://github.com/paritytech/hardhat-polkadot/commit/6b513524014704d997d712ea73ff68008a6cc989))
- Update types. ([#211](https://github.com/paritytech/hardhat-polkadot/pull/211)) ([bcc580b](https://github.com/paritytech/hardhat-polkadot/commit/bcc580bcd8886158b8c9b3ffa900bce8c7bfacb6))
- Improve cache info and optimize default parameters. ([#205](https://github.com/paritytech/hardhat-polkadot/pull/205)) ([055660e](https://github.com/paritytech/hardhat-polkadot/commit/055660e7c7c415734c4df2ce7150605d51c665a0))
- Enable usage of multiple solidity versions when compiling with the binary. ([#204](https://github.com/paritytech/hardhat-polkadot/pull/204)) ([6f173d6](https://github.com/paritytech/hardhat-polkadot/commit/6f173d626fe1b629e7d1dfe10055e3731125b932))


## 0.1.5 (2025-06-24)
### Bug Fixes

- Fix binary cache not working. ([#184](https://github.com/paritytech/hardhat-polkadot/pull/184)) ([07e325f](https://github.com/paritytech/hardhat-polkadot/commit/07e325f93a8fdf6f4afaed9c740859cb002330a6))

### Chores

- Bump `@parity/resolc` to `v0.2.0`. ([#173](https://github.com/paritytech/hardhat-polkadot/pull/173)) ([3857c66](https://github.com/paritytech/hardhat-polkadot/commit/3857c666800d02a3b7c9bf3eb4e98b8e35394c90))


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
