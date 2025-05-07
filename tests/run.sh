#!/usr/bin/env bash

# fail if any commands fails
set -e

# 1) build and export packages/hardhat-polkadot
cd ..
pnpm install >/dev/null 2>&1
pnpm build >/dev/null 2>&1
cd ./packages/hardhat-polkadot
HARDHAT_TGZ_FILE=$(pnpm pack | grep "hardhat-*.*.*.tgz")
HARDHAT_POLKADOT_PACKAGE_PATH="$(pwd)/$HARDHAT_TGZ_FILE"
export HARDHAT_POLKADOT_PACKAGE_PATH
cd ../../tests >/dev/null

# 2) create a temporary directory to run the tests
TMP_DIR=$(mktemp -d -t hardhat-polkadot.XXXXXXX)
TMP_TESTS_DIR="${TMP_DIR}/run-$(date +%Y-%m-%d-%H-%M-%S)"
cp -r fixture-projects $TMP_TESTS_DIR
cp helpers.sh $TMP_TESTS_DIR/helpers.sh  # copy the helper script

# 3) print relevant info
printf "Package manager version: npm version $(npm --version)\n"
printf "@parity/hardhat-polkadot package in $HARDHAT_POLKADOT_PACKAGE_PATH\n"
printf "Running tests in $TMP_TESTS_DIR\n\n"

# 4) run the E2E tests
for file in ./e2e/*; do
    if [ -f "$file" ]; then
        FILE_NAME=$(basename "$file")
        cp "$file" "$TMP_TESTS_DIR/$FILE_NAME"
        chmod +x "$TMP_TESTS_DIR/$FILE_NAME"
        pushd "$TMP_TESTS_DIR" >/dev/null  # cd into the fixture folder, saving old dir
        ./"$FILE_NAME"  # run $file inside tmp
        popd >/dev/null # cd back to start
    fi
done