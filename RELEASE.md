## Release guide

This repository releases 5 artifacts:

A) [@parity/hardhat-polkadot](https://www.npmjs.com/package/@parity/hardhat-polkadot)
B) [@parity/hardhat-polkadot-node](https://www.npmjs.com/package/@parity/hardhat-polkadot-node) (included in A)
C) [@parity/hardhat-polkadot-resolc](https://www.npmjs.com/package/@parity/hardhat-polkadot-resolc) (included in umbrella)
D) *Prebuilt [revive-dev-node](https://github.com/paritytech/polkadot-sdk/tree/master/substrate/frame/revive/dev-node) binary
E) *Prebuilt [eth-rpc](https://github.com/paritytech/polkadot-sdk/tree/master/substrate/frame/revive/rpc) binary



### Release A, B and C

- Go to the [Releases page](https://github.com/paritytech/hardhat-polkadot/releases) and click “Draft new release”.
- Set tag (vX.Y.Z), title, and notes; click “Publish release”.
- Monitor the workflow: [NPM release workflow](https://github.com/paritytech/hardhat-polkadot/actions/workflows/npm-release.yml).
- When it finishes, check the artifact `packages-<sha>` contains three `.tgz` files.
- Verify the downstream publish in [`paritytech/npm_publish_automation` Actions](https://github.com/paritytech/npm_publish_automation/actions).
- Confirm new versions appear on NPM.

### Release D and E

- Open [Actions → Release Polkadot Development Runtime](https://github.com/paritytech/hardhat-polkadot/actions/workflows/release-dev-node.yml).
- Click “Run workflow”, set `sdk-branch` if needed, then “Run”.
- Wait for the matrix and `publish-release` jobs to complete.
- Check the newly created Release `nodes-<run_id>` (assets + checksums) and the rolling `nodes-latest` prerelease.
- Download binaries as needed; optionally validate with `shasum -a 256`.