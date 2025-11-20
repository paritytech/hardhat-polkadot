# Changelog

## 0.2.1 (2025-11-20)
### Chores

- Upgrade default compiler version. ([#370](https://github.com/paritytech/hardhat-polkadot/pull/370)) ([f698b18](https://github.com/paritytech/hardhat-polkadot/commit/f698b1899486b2839ac44f55c7db4114c2758262))


## 0.2.0 (2025-11-11)
### Chores

- Promote `0.2.0-p3` hotfix to stable release. No code changes


## 0.2.0-pre3 (2025-11-06)
### Bug Fixes

- Remove artifacts and cache suffix. ([#349](https://github.com/paritytech/hardhat-polkadot/pull/349)) ([5824d71](https://github.com/paritytech/hardhat-polkadot/commit/5824d71ae683434a4c688909ec50bb1e9c86993c))


## 0.2.0-pre2 (2025-10-30)
### Bug Fixes

- Add `storageLayout` to `outputSelection`. ([#346](https://github.com/paritytech/hardhat-polkadot/pull/346)) ([8cd6751](https://github.com/paritytech/hardhat-polkadot/commit/8cd67513aff47076d76d5905592559d60b8a94fd))


## 0.2.0-pre1 (2025-10-06)
### Features

- Fix `0x` prefix with EVM Backend. ([#341](https://github.com/paritytech/hardhat-polkadot/pull/341)) ([412c371](https://github.com/paritytech/hardhat-polkadot/commit/412c3710471a3d77f4ed7eaf19e0ea598ed2858a))


## 0.2.0-pre0 (2025-09-11)
### Features

- Add EVM Backend support. ([#308](https://github.com/paritytech/hardhat-polkadot/pull/308)) ([0c46b99](https://github.com/paritytech/hardhat-polkadot/commit/0c46b994c45811a54a22852591a67d90d134c884))

### Bug Fixes

- Fix recompilation issue. ([#311](https://github.com/paritytech/hardhat-polkadot/pull/311)) ([704e7ee](https://github.com/paritytech/hardhat-polkadot/commit/704e7ee01abd03bcaadfb3959ff1911363948db1))
- Extend compilation output. ([#302](https://github.com/paritytech/hardhat-polkadot/pull/302)) ([6df4038](https://github.com/paritytech/hardhat-polkadot/commit/6df4038bb861d223c23b053fa1f6e177bb1e5c0b))
- Replace `npm` references with `pnpm`. ([#301](https://github.com/paritytech/hardhat-polkadot/pull/301)) ([985f345](https://github.com/paritytech/hardhat-polkadot/commit/985f3459b587e735661ff47c47dbbaade8068d62))

### Chores

- Bump `@eslint/js` from 9.30.1 to 9.34.0. ([#296](https://github.com/paritytech/hardhat-polkadot/pull/296)) ([82493d0](https://github.com/paritytech/hardhat-polkadot/commit/82493d06ce23b9e901690ebd30bf039d44945ec2))


## 0.1.9-pre0 (2025-08-18)
### Bug Fixes

- removing `bundledDependencies` ([#284](https://github.com/paritytech/hardhat-polkadot/pull/284)) ([558707fd](https://github.com/paritytech/hardhat-polkadot/commit/558707fde47e99123ec7f4946b735c49102b1d39))

### Chores

- Bump `@parity/resolc` to 0.3.0. ([#216](https://github.com/paritytech/hardhat-polkadot/pull/216)) ([20cd285](https://github.com/paritytech/hardhat-polkadot/commit/20cd285a3d9d64356294038153e518e38a63f0d7))


## 0.1.8 (2025-08-13)
### Bug Fixes

- Enable polkavm when not set in default Hardhat network. ([#253](https://github.com/paritytech/hardhat-polkadot/pull/253)) ([0f33d17](https://github.com/paritytech/hardhat-polkadot/commit/0f33d171ff353d3aced247759853f8a5939678b2))
- Flip default `resolc`check to check for `npm` instead of `binary`. ([#247](https://github.com/paritytech/hardhat-polkadot/pull/247)) ([30b441f](https://github.com/paritytech/hardhat-polkadot/commit/30b441f27ad14056dced88d038d5eaa016594de0))
- Fix default `resolc` config to default to `binary` instead of `npm`. ([#246](https://github.com/paritytech/hardhat-polkadot/pull/246)) ([eed3acc](https://github.com/paritytech/hardhat-polkadot/commit/eed3accc25918a988845072a981f9a0c868e3324))

### Chores

- Bump `@parity/resolc` to 0.3.0. ([#216](https://github.com/paritytech/hardhat-polkadot/pull/216)) ([20cd285](https://github.com/paritytech/hardhat-polkadot/commit/20cd285a3d9d64356294038153e518e38a63f0d7))


## 0.1.7 (2025-07-22)
### Chores

- Promote `0.1.6-p0` hotfix to stable release. No code changes


## 0.1.6-p0 (2025-07-17)
🔧 **Hotfix for `0.1.6`**
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
