# hardhat-polkadot-migrator

Migration tool for porting existing Hardhat projects to Polkadot-compatible Hardhat projects. It handles both upgrading to Hardhat v3 (if needed) and adding Polkadot plugin support.

## What it does

- Upgrades `hardhat` to `^3.0.0` in `package.json` if the current version is below v3.
- Adds `@parity/hardhat-polkadot` as a dev dependency (fetches the latest version from npm).
- Inserts the Polkadot plugin import into `hardhat.config`.
- Adds `plugins: [polkadot]` to the config object.
- Wraps the config with `defineConfig()` if not already wrapped.
- Patches in default Polkadot node configuration (`polkadot: true` and `nodeConfig`).
- Merges `.gitignore` with recommended entries.

All transformations are idempotent — running `port` twice won't duplicate imports, plugins, or config entries.

## Usage

### Create a new project

```bash
$ npx hardhat-polkadot init
```

Use `-y` / `--yes` to accept defaults without prompts.

### Migrate an existing project

```bash
$ npx hardhat-polkadot port <project-dir>
```

This will show a diff of all proposed changes and prompt for confirmation before writing.

## Happy building! 👷‍♀️👷‍♂️
