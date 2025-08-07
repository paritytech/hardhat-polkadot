#!/usr/bin/env bash

# fail if any commands fails
set -e
TESTS_TYPE=${1:-e2e} # default to flag 'e2e' if not provided

# 1) run tests in {DIR} according to flag passed
case "$TESTS_TYPE" in
  unit|--unit) DIR=unit ;;
  e2e|--e2e)   DIR=e2e  ;;
  *) echo "Unknown test type: $TESTS_TYPE" >&2; exit 1 ;;
esac

# 2) build and export packages/hardhat-polkadot
cd ..
pnpm install
pnpm run build
cd ./packages/hardhat-polkadot
./prepack.sh # run prepack script
HARDHAT_POLKADOT_TGZ=$(pnpm pack --silent | grep "parity-hardhat-polkadot-*.*.*.tgz")
export HARDHAT_POLKADOT_TGZ_PATH="$(pwd)/$HARDHAT_POLKADOT_TGZ"
cd ../../tests >/dev/null

# 3) create a temporary directory to run the tests
TMP_DIR=$(mktemp -d -t hardhat-polkadot.XXXXXXX)
export TMP_TESTS_DIR="${TMP_DIR}/run-$(date +%Y-%m-%d-%H-%M-%S)"
cp -r fixture-projects $TMP_TESTS_DIR
cp helpers.sh $TMP_TESTS_DIR/helpers.sh  # copy the helper script

# 4) print relevant info
printf "Package manager version: npm version $(npm --version)\n"
printf "@parity/hardhat-polkadot package in $HARDHAT_POLKADOT_TGZ_PATH\n"
printf "Running tests in $TMP_TESTS_DIR\n\n"

for file in ./$DIR/*; do
    FILE_NAME=$(basename "$file")
    printf "Running test: $FILE_NAME"

    cp "$file" "$TMP_TESTS_DIR/$FILE_NAME"
    chmod +x "$TMP_TESTS_DIR/$FILE_NAME"
    pushd "$TMP_TESTS_DIR" >/dev/null  # cd into the fixture folder, saving old dir
    ./"$FILE_NAME"  # run $file inside tmp
    popd >/dev/null # cd back to start
done
