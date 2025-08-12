## Release guide

This repository ships two kinds of releases:

- NPM packages for the Hardhat Polkadot toolchain
- Prebuilt runtime binaries (revive-dev-node and eth-rpc) built from `polkadot-sdk`

Both are automated via dedicated GitHub Actions workflows. This document explains how they work, how to trigger them, and what they produce.

### Contents

- <a href="#npm-packages-release">NPM Workflow</a>: 
    - [.github/workflows/npm-release.yml](.github/workflows/npm-release.yml)
- <a href="#nodes-binaries-release-revive-dev-node-and-eth-rpc">Nodes Workflow</a>: 
    - [.github/workflows/release-nodes.yml](.github/workflows/release-nodes.yml)

---

## NPM packages release

### Workflow

File: `/.github/workflows/npm-release.yml`

- Triggers when a GitHub Release is published for this repo

### What it does

1. Checks out the repository
2. Sets up Node.js 22.x and installs `pnpm`
3. Installs dependencies with `pnpm install --frozen-lockfile`
4. Builds the monorepo with `pnpm build`
5. Packs the three workspace packages into `.tgz` tarballs via `pnpm pack` in each package directory:
   - `packages/hardhat-polkadot-resolc`
   - `packages/hardhat-polkadot-node`
   - `packages/hardhat-polkadot`
6. Collects the generated tarballs into `packs/` and uploads them as a workflow artifact named `packages-${{ github.sha }}`
7. Triggers a downstream publish workflow in the [paritytech/npm_publish_automation](https://github.com/paritytech/npm_publish_automation) repository using the `octokit/request-action`, passing:
   - `repo`: the current repository (e.g., `paritytech/hardhat-polkadot`)
   - `run_id`: the current workflow run id
   - Authentication: `GITHUB_TOKEN` set from `secrets.NPM_PUBLISH_AUTOMATION_TOKEN`

The external automation is responsible for actually publishing the generated tarballs to NPM.

### Inputs and secrets

- Secrets
  - `NPM_PUBLISH_AUTOMATION_TOKEN`: GitHub token with permission to dispatch workflows in `paritytech/npm_publish_automation`. It is used only to trigger the downstream publish.

### Produced artifacts

- Workflow artifact: `packages-${{ github.sha }}` containing three `.tgz` files (one per workspace package)
- NPM publications: created by the external automation, not in this workflow job itself

### How to trigger

1. Prepare versions and changelogs in the workspace packages as usual
2. Create and publish on [GitHub Releases](https://github.com/paritytech/hardhat-polkadot/releases) page.
3. The workflow will run automatically on the `released` event, build and pack the packages, upload the tarballs, and dispatch the publish to the external automation

### Verification checklist

- Confirm the workflow succeeded: GitHub Actions → NPM Hardhat-Polkadot Release
- Inspect the uploaded `packages-<sha>` artifact for the three tarballs
- In the downstream repo [npm_publish_automation/actions](https://github.com/paritytech/npm_publish_automation/actions), verify the publish run that corresponds to your `repo` and `run_id`
- Confirm the new versions are visible on NPM

---

## Nodes binaries release (revive-dev-node and eth-rpc)

This is a temporary release for testing purposes, later may be either stabilized or removed at all.

### Workflow

File: `/.github/workflows/release-nodes.yml`

- Triggers:
  - `workflow_dispatch` (manual run from [Actions tab](https://github.com/paritytech/hardhat-polkadot/actions/workflows/release-nodes.yml)) where `sdk-branch` (defaults to `anp-dirty-node` for now) is a dev-node source branch to build from.
- Permissions: only `contents: write` (required to create GitHub Releases)

### What it builds

- Two binaries from `polkadot-sdk`:
  - `revive-dev-node`
  - `eth-rpc` (package `pallet-revive-eth-rpc`)

### Matrix and runners

Builds for three targets in parallel:

- Linux: `x86_64-unknown-linux-gnu` on `parity-default`
- macOS (Apple Silicon): `aarch64-apple-darwin` on `parity-macos`
- macOS (Intel): `x86_64-apple-darwin` on `macos-13`

Windows is accounted for, but disabled for now.

### High-level steps

1. Install OS-specific build dependencies. 
    > Note: parity-default and parity-macos are Parity self-hosted runners, thus come empty, that's why we need to install minimal dependencies manually. Reference of minimal dependencies [1](https://github.com/paritytech/polkadot-sdk/blob/2db5e16bf2b497e8ef877d3d7e79b3fcdcab5f82/scripts/getting-started.sh#L59) and [2](https://github.com/paritytech/dockerfiles/blob/main/ci-unified/Dockerfile): 
2. Checkout this repository (context)
3. Clone `polkadot-sdk` at the requested branch (see Inputs below)
4. Source `polkadot-sdk/.github/env` to read the `IMAGE` value and derive the Rust version
5. Install toolchain via `dtolnay/rust-toolchain` action with `wasm32-unknown-unknown` and the target triple
6. Cache Cargo registry, git, and `polkadot-sdk/target`
7. Build release binaries with Cargo for both packages
8. Stage and rename artifacts with OS/arch suffixes into `out/`
9. Generate `sha256` checksums
10. Upload per-target artifacts
11. Aggregate artifacts in a `publish-release` job, generate release notes (including checksums), and publish a GitHub Release
12. Update a rolling `nodes-latest` prerelease tag with the same assets

### Inputs

- Manual input
  - `sdk-branch` (required; defaults to `anp-dirty-node`): branch in `paritytech/polkadot-sdk` to build from

### Produced artifacts and releases

- Per-target uploaded artifacts named: `nodes-<os_tag>-<arch_tag>`
- Files per target (in `dist/` when aggregated):
  - `revive-dev-node-<os>-<arch>`
  - `eth-rpc-<os>-<arch>`
  - `checksums.txt`
- GitHub Release:
  - Tag: `nodes-${{ github.run_id }}` (unique per run)
  - Name: `Nodes build ${{ github.run_id }}`
  - Prerelease: `true` (to avoid becoming the repo’s “latest” release, which would conflict with the main NPM packages release, when anyone goes to https://github.com/paritytech/hardhat-polkadot/releases/latest)
  - Body: includes build date and checksums
- Rolling prerelease tag `nodes-latest` is (re)created/updated with the same assets

### How to trigger

1. Go to [Actions → Release Polkadot Development Runtime](https://github.com/paritytech/hardhat-polkadot/actions/workflows/release-nodes.yml)
2. Click “Run workflow”, provide `sdk-branch` (or accept the default), and start the run
3. Wait for the `compile` matrix to finish and the `publish-release` job to complete

### Verification checklist

- Confirm the `compile` matrix succeeded for all targets
- Inspect the generated `RELEASE_BODY.md` and ensure checksums are present
- Check the newly created GitHub Release with tag `nodes-<run_id>` contains the expected assets
- Confirm `nodes-latest` points to the most recent build and has matching assets

---

## Operational tips and troubleshooting

- Ensure `NPM_PUBLISH_AUTOMATION_TOKEN` is configured in repo secrets for NPM releases
- Validate binaries locally by checking `--version` or running a minimal smoke test; verify checksums with `shasum -a 256 <file>`


