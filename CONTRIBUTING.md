# Contribute to Hardhat Polkadot

## Testing

#### Run workflow `run-unit-tests` locally on `ubuntu-latest` using a Mac Apple M2

```bash
act -j run-unit-tests -P ubuntu-latest=catthehacker/ubuntu:act-20.04 --reuse -b
```

#### Run workflow `run-unit-tests` locally on `macos-latest` using a Mac Apple M2

1. In .github/workflows/tests.yml, remove `ubuntu-latest` from matrix.os leaving only:
```yml
matrix:
  os: [macos-latest]
```

2. Execute
```bash
act -j run-unit-tests -P macos-latest=-self-hosted -b
```

#### Run workflow `run-e2e-tests` locally on `ubuntu-latest` using a Mac Apple M2

```bash
act -j run-e2e-tests -P ubuntu-latest=catthehacker/ubuntu:act-20.04 --reuse -b
```