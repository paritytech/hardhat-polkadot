#!/usr/bin/env bash

# fail if any commands fails
set -e

# 1) build packages/hardhat-polkadot
cd ../packages/hardhat-polkadot
pnpm install
pnpm build
HARDHAT_TGZ_FILE=$(pnpm pack | grep "hardhat-*.*.*.tgz")
cd - >/dev/null

# 2) create a temporary directory to run the tests
TMP_DIR=$(mktemp -d -t hardhat-polkadot)
TMP_TESTS_DIR="${TMP_DIR}/run-$(date +%Y-%m-%d-%H-%M-%S)"
cp -r fixture-projects $TMP_TESTS_DIR
cp helpers.sh $TMP_TESTS_DIR/helpers.sh  # copy the helper script

# 3) export package path to be used in tmp tests dir
HARDHAT_POLKADOT_PACKAGE_PATH="$(pwd)/../packages/hardhat-core"/$HARDHAT_TGZ_FILE
export HARDHAT_POLKADOT_PACKAGE_PATH
printf "Package manager version: npm version $(npm --version)\n"
printf "Running tests in $TMP_TESTS_DIR\n\n"

# E2E
for file in ./e2e/*; do
    if [ -f "$file" ]; then
        FILE_NAME=$(basename "$file")
        cp "$file" "$TMP_TESTS_DIR/$FILE_NAME"
        chmod +x "$TMP_TESTS_DIR/$FILE_NAME"
        echo "[e2e] Running file $(basename "$file")"
        pushd "$TMP_TESTS_DIR" >/dev/null  # cd into the fixture folder, saving old dir
        ./"$FILE_NAME"  # run $file inside tmp
        popd >/dev/null # cd back to start
    fi
done