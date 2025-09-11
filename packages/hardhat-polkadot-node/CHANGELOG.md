# Changelog

## 0.1.6-pre2 (2025-09-11)
### Features

- Add EVM Backend support. ([#308](https://github.com/paritytech/hardhat-polkadot/pull/308)) ([0c46b99](https://github.com/paritytech/hardhat-polkadot/commit/0c46b994c45811a54a22852591a67d90d134c884))

### Bug Fixes

- Fix child process handling. ([#307](https://github.com/paritytech/hardhat-polkadot/pull/307)) ([0d5db06](https://github.com/paritytech/hardhat-polkadot/commit/0d5db06e072ad4fc67f0bd10ff6e14abfe354574))

### Chores

- Bump `@eslint/js` from 9.30.1 to 9.34.0. ([#296](https://github.com/paritytech/hardhat-polkadot/pull/296)) ([82493d0](https://github.com/paritytech/hardhat-polkadot/commit/82493d06ce23b9e901690ebd30bf039d44945ec2))


## 0.1.6-pre1 (2025-08-20)
### Bug Fixes

- displaying node output if node fails to start ([#291](https://github.com/paritytech/hardhat-polkadot/pull/291)) ([91c91f9](https://github.com/paritytech/hardhat-polkadot/commit/91c91f93fcc0e6a023fb55188ac6179d7c3315e9))

## 0.1.6-pre0 (2025-08-18)
### Bug Fixes

- removing `bundledDependencies` ([#284](https://github.com/paritytech/hardhat-polkadot/pull/284)) ([558707fd](https://github.com/paritytech/hardhat-polkadot/commit/558707fde47e99123ec7f4946b735c49102b1d39))
- fix(hardhat-polkadot-node): spin up an archive node ([#286](https://github.com/paritytech/hardhat-polkadot/pull/286)) ([ba1bc28](https://github.com/paritytech/hardhat-polkadot/commit/ba1bc28af3bd84b43d0e946b6876f03b027ea0bc))
- Fixing tests; adding verbosity: ([#290](https://github.com/paritytech/hardhat-polkadot/pull/290)) ([2b8e0fc](https://github.com/paritytech/hardhat-polkadot/commit/2b8e0fc8cd659e42b6efb2b93295d5842d26bd36))

## 0.1.5 (2025-08-13)
### Bug fixes

- Rename node to `anvil` to work with network helpers. ([#273](https://github.com/paritytech/hardhat-polkadot/pull/273)) ([79d2504](https://github.com/paritytech/hardhat-polkadot/commit/79d2504a7aa77dca9985b22bb2e16b46317dfbd8))
- Support deploying factory contracts. ([#256](https://github.com/paritytech/hardhat-polkadot/pull/256)) ([c995b32](https://github.com/paritytech/hardhat-polkadot/commit/c995b32784802c90fc4ce617854608bb6d224be5))
- Enable polkavm when not set in default Hardhat network. ([#253](https://github.com/paritytech/hardhat-polkadot/pull/253)) ([0f33d17](https://github.com/paritytech/hardhat-polkadot/commit/0f33d171ff353d3aced247759853f8a5939678b2))
- Create applications as a combination of services ([#248](https://github.com/paritytech/hardhat-polkadot/pull/248)) ([dea3516](https://github.com/paritytech/hardhat-polkadot/commit/dea351652dd9eeeed427dbf9ff4b74e815bdc315))


## 0.1.4 (2025-07-22)
### Bug fixes

- Enable `Docker` for running tests. ([#239](https://github.com/paritytech/hardhat-polkadot/pull/239)) ([cac72f6](https://github.com/paritytech/hardhat-polkadot/commit/cac72f6270ac41b3c1d22045c82ca77ca73240fd))


## 0.1.3-p1 (2025-07-17)
🔧 **Hotfix for `0.1.3`**
### Chores

- Bump hardhat to 2.26.0 ([#235](https://github.com/paritytech/hardhat-polkadot/pull/235)) ([89efa94](https://github.com/paritytech/hardhat-polkadot/commit/89efa9498cbe16e32a97519a40a8e1ce4b915f08))


## 0.1.3-p0 (2025-07-14)
🔧 **Hotfix for `0.1.3`**
### Bug fixes

- Add consensus type to dev node options. ([#228](https://github.com/paritytech/hardhat-polkadot/pull/228)) ([d0846cd](https://github.com/paritytech/hardhat-polkadot/commit/d0846cd2feef66232f7e97d1adffaccb55d4ec58))
- Fix rpc param when using chopsticks. ([#225](https://github.com/paritytech/hardhat-polkadot/pull/225)) ([512bc2e](https://github.com/paritytech/hardhat-polkadot/commit/512bc2e9d158ee77268f01d6cb90851724195d64))


## 0.1.3 (2025-06-24)
### Bug fixes

- Include setup task in test override. ([#194](https://github.com/paritytech/hardhat-polkadot/pull/194)) ([a605b18](https://github.com/paritytech/hardhat-polkadot/commit/a605b181cbaec747e3ddeeffc7f98f19f5d45116))
- Fix node and eth-rpc restart. ([#186](https://github.com/paritytech/hardhat-polkadot/pull/186)) ([9e9d4cb](https://github.com/paritytech/hardhat-polkadot/commit/9e9d4cbac6cf9ce3fe9dfc33daed68ce6ff7287d))


## 0.1.2 (2025-06-03)
### Bug fixes

- Remove check for node and adapter path to decide if we wait for the port to be ready or not. ([#159](https://github.com/paritytech/hardhat-polkadot/pull/159)) ([172515b](https://github.com/paritytech/hardhat-polkadot/commit/172515b0c8bea891123d74208fd07f56cffb974b))
- RPC server using Docker breaks forking. ([#158](https://github.com/paritytech/hardhat-polkadot/pull/158)) ([b97ed7b](https://github.com/paritytech/hardhat-polkadot/commit/b97ed7b59efca4c724641a0ece239617dba49160))
- Deprecate `adapterEndpoint`. ([#151](https://github.com/paritytech/hardhat-polkadot/pull/151)) ([7f007da](https://github.com/paritytech/hardhat-polkadot/commit/7f007daf7a38f3f5eff84829d3a3a02e5cca1d1f))


## 0.1.1 (2025-05-08)
### Bug Fixes

- Default `buildBlockMode` to `Instant` when forking. ([#104](https://github.com/paritytech/hardhat-polkadot/pull/104)) ([d2989d1](https://github.com/paritytech/hardhat-polkadot/commit/d2989d153365b2ee7a6d84e3f25fc2dc285b6624))
- Fix chopsticks commands not being parsed. ([#101](https://github.com/paritytech/hardhat-polkadot/pull/101)) ([eebf1aa](https://github.com/paritytech/hardhat-polkadot/commit/eebf1aa44c303d90184ac4f37536cd6f14979ab8))
