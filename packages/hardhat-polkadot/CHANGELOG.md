# Changelog
## 0.1.11-pre0 (2025-08-18)

### Bug Fixes

- removing `bundledDependencies` ([#284](https://github.com/paritytech/hardhat-polkadot/pull/284)) ([558707fd](https://github.com/paritytech/hardhat-polkadot/commit/558707fde47e99123ec7f4946b735c49102b1d39))

## 0.1.10 (2025-08-13)
### Chores

- Resolve micro-eth-signer to 0.16.0. ([#270](https://github.com/paritytech/hardhat-polkadot/pull/270)) ([9b97254](https://github.com/paritytech/hardhat-polkadot/commit/9b972541aff4fc51ae206d0754f9ffea8669077e))
- Add a -y flag to the init process. Serve a hardhat config that has all the endpoints already configured. ([#262](https://github.com/paritytech/hardhat-polkadot/pull/262)) ([a8cad65](https://github.com/paritytech/hardhat-polkadot/commit/a8cad6506c1019759e7e5565cdb4b976d233d20c))

### Internal

- Bumped `@parity/hardhat-polkadot-resolc` to `0.1.8`.
- Bumped `@parity/hardhat-polkadot-node` to `0.1.5`.


## 0.1.9 (2025-07-22)
### Internal

- Bumped `@parity/hardhat-polkadot-resolc` to `0.1.7`.
- Bumped `@parity/hardhat-polkadot-node` to `0.1.4`.


## 0.1.8-p1 (2025-07-17)
🔧 **Hotfix for `0.1.8`**
### Chores

- Bump hardhat to 2.26.0 ([#235](https://github.com/paritytech/hardhat-polkadot/pull/235)) ([89efa94](https://github.com/paritytech/hardhat-polkadot/commit/89efa9498cbe16e32a97519a40a8e1ce4b915f08))


## 0.1.8-p0 (2025-07-14)
🔧 **Hotfix for `0.1.8`**
### Bug fixes

- Fix testnet url. ([#226](https://github.com/paritytech/hardhat-polkadot/pull/226)) ([c9da20c](https://github.com/paritytech/hardhat-polkadot/commit/c9da20cecc146dd2e5052b2877c1c965f82e0a83))

### Internal

- Bumped `@parity/hardhat-polkadot-node` to `0.1.3-p0`.


## 0.1.8 (2025-07-04)
### Internal

- Bumped `@parity/hardhat-polkadot-resolc` to `0.1.6`.


## 0.1.7 (2025-06-24)
### Internal

- Bumped `@parity/hardhat-polkadot-resolc` to `0.1.5`.
- Bumped `@parity/hardhat-polkadot-node` to `0.1.3`.


## 0.1.6 (2025-06-03)
### Bug Fixes

- Fix tests with custom errors. ([#169](https://github.com/paritytech/hardhat-polkadot/pull/169)) ([18aace7](https://github.com/paritytech/hardhat-polkadot/commit/18aace7eb3aff5bbb456cf7a2a9cecb67d19de54))
- Fix Viem project creation. ([#160](https://github.com/paritytech/hardhat-polkadot/pull/160)) ([5e9f584](https://github.com/paritytech/hardhat-polkadot/commit/5e9f584687ff3c79e921bbc2afe206bd46822528))
- Extend code size check override when running custom scripts. ([#143](https://github.com/paritytech/hardhat-polkadot/pull/143)) ([2ba4fd2](https://github.com/paritytech/hardhat-polkadot/commit/2ba4fd2ca970b413eaa54dae0839ff0f0d548ee2)) (thanks to [@nhussein](https://github.com/nhussein11))
- Remove workspace dependencies from peerDependencies. ([#135](https://github.com/paritytech/hardhat-polkadot/pull/135)) ([b0ba6ce](https://github.com/paritytech/hardhat-polkadot/commit/b0ba6cedfa4133419cd4c080bb596a598bc13196))
- Fix dependency installation when creating an empty hardhat project. ([#128](https://github.com/paritytech/hardhat-polkadot/pull/128)) ([f23a6ce](https://github.com/paritytech/hardhat-polkadot/commit/f23a6ceb072c1cc8f5a69b0e6876634079ab8677)) 
- Updated gitignore to contain *-pvm folders. ([#127](https://github.com/paritytech/hardhat-polkadot/pull/127)) ([5a5624b](https://github.com/paritytech/hardhat-polkadot/commit/5a5624bf6e3a9bf3f80c38827704fb3d17dfb60a))

### Chores

- Add network config examples. ([#154](https://github.com/paritytech/hardhat-polkadot/pull/154)) ([35a7ce8](https://github.com/paritytech/hardhat-polkadot/commit/35a7ce8d4f8314da2ba2796950daa356579b54e7)) (thanks [@brianspha](https://github.com/Brianspha))
- Remove `version` from `resolcConfig` examples and docs. ([#165](https://github.com/paritytech/hardhat-polkadot/pull/165)) ([7060d8d](https://github.com/paritytech/hardhat-polkadot/commit/7060d8d2671b22e7275e83df0ddfebdc91dd1328))

### Internal

- Bumped `@parity/hardhat-polkadot-resolc` to `0.1.4`.
- Bumped `@parity/hardhat-polkadot-node` to `0.1.2`.


## 0.1.5 (2025-05-13)
### Bug Fixes

- Update empty config file creation. ([#117](https://github.com/paritytech/hardhat-polkadot/pull/117)) ([4ac6133](https://github.com/paritytech/hardhat-polkadot/commit/4ac6133d54bd57c2e5462531558c0e475d666811))
- Extends size check patch usage. ([#116](https://github.com/paritytech/hardhat-polkadot/pull/116)) ([c753764](https://github.com/paritytech/hardhat-polkadot/commit/c753764f3c7de159a9e1b1927e86907e8180c945))

### Internal

- Bumped `@parity/hardhat-polkadot-resolc` to `0.1.3`.


## 0.1.4 (2025-05-08)
### Internal

- Bumped `@parity/hardhat-polkadot-resolc` to `0.1.2`.


## 0.1.3 (2025-05-08)
### Bug Fixes

- Patch to `hardhat ignition` to bypass `ethereumjs-tx`'s `checkMaxInitCodeSize`. ([#106](https://github.com/paritytech/hardhat-polkadot/pull/106)) ([ee53654](https://github.com/paritytech/hardhat-polkadot/commit/ee5365440e05eba338feb979f6e739468327c799))
- Add `tsconfig` to sample project. ([#105](https://github.com/paritytech/hardhat-polkadot/pull/105)) ([08d19d7](https://github.com/paritytech/hardhat-polkadot/commit/08d19d7f4a729f78dcf468f1bda7ea6d2cae7612))


## 0.1.2 (2025-05-05)
### Bug Fixes

- Add missing `sample-projects` file to package files list. ([#94](https://github.com/paritytech/hardhat-polkadot/pull/94)) ([8a59406](https://github.com/paritytech/hardhat-polkadot/commit/8a59406fa92206778203057cb151e1fbad238e80))


## 0.1.1 (2025-05-05)
### Bug Fixes

- Add missing `recommended-gitignore.txt` file to package files list. ([#91](https://github.com/paritytech/hardhat-polkadot/pull/91)) ([9337d9d](https://github.com/paritytech/hardhat-polkadot/commit/9337d9df83718cad9a75def718d8841e594e1134))
