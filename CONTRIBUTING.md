# Contribute to Hardhat Polkadot

## Testing

Run workflow `run-tests` locally on `ubuntu-latest` using a Mac Apple M2

```bash
act -j run-tests -P ubuntu-latest=catthehacker/ubuntu:act-20.04 --reuse
```

Run workflow `run-tests` locally on `macos-latest` using a Mac Apple M2

```bash
act -j run-tests -P macos-latest=-self-hosted
```