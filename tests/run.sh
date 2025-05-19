#!/usr/bin/env bash

# fail if any commands fails
set -e
TESTS_TYPE=${1:-e2e} # default to flag 'e2e' if not provided

# 1) build and export packages/hardhat-polkadot
cd ..
pnpm install
pnpm run build
cd ./packages/hardhat-polkadot
./prepack.sh # run prepack script
HARDHAT_POLKADOT_TGZ=$(pnpm pack --silent | grep "parity-hardhat-polkadot-*.*.*.tgz")
export HARDHAT_POLKADOT_TGZ_PATH="$(pwd)/$HARDHAT_POLKADOT_TGZ"
cd ../../tests >/dev/null

# 2) create a temporary directory to run the tests
TMP_DIR=$(mktemp -d -t hardhat-polkadot.XXXXXXX)
TMP_TESTS_DIR="${TMP_DIR}/run-$(date +%Y-%m-%d-%H-%M-%S)"
cp -r fixture-projects $TMP_TESTS_DIR
cp helpers.sh $TMP_TESTS_DIR/helpers.sh  # copy the helper script

# 3) print relevant info
printf "Package manager version: npm version $(npm --version)\n"
printf "@parity/hardhat-polkadot package in $HARDHAT_POLKADOT_TGZ_PATH\n"
printf "Running tests in $TMP_TESTS_DIR\n\n"

# 4) run tests according to flag passes
if [[ "$TESTS_TYPE" == "--unit" || "$TESTS_TYPE" == "unit" ]]; then
    for file in ./unit/*; do
        FILE_NAME=$(basename "$file")
        cp "$file" "$TMP_TESTS_DIR/$FILE_NAME"
        chmod +x "$TMP_TESTS_DIR/$FILE_NAME"
        pushd "$TMP_TESTS_DIR" >/dev/null  # cd into the fixture folder, saving old dir
        ./"$FILE_NAME"  # run $file inside tmp
        popd >/dev/null # cd back to start
    done
fi

if [[ "$TESTS_TYPE" == "--e2e" || "$TESTS_TYPE" == "e2e" ]]; then
    for file in ./e2e/*; do
        FILE_NAME=$(basename "$file")
        cp "$file" "$TMP_TESTS_DIR/$FILE_NAME"
        chmod +x "$TMP_TESTS_DIR/$FILE_NAME"
        pushd "$TMP_TESTS_DIR" >/dev/null  # cd into the fixture folder, saving old dir
        ./"$FILE_NAME"  # run $file inside tmp
        popd >/dev/null # cd back to start
    done
fi