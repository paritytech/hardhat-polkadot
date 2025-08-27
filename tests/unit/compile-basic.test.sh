#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cp ./basic-compile.config.js ./foo/hardhat.config.js # relative to tmp folder
cd ./foo # relative to tmp folder
pnpm add "$HARDHAT_POLKADOT_NODE_TGZ_PATH"
pnpm add "$HARDHAT_POLKADOT_RESOLC_TGZ_PATH"
pnpm add "$HARDHAT_POLKADOT_TGZ_PATH"
pnpm install # install modules specified in the package.json

# When
run_test_and_handle_failure "npx hardhat compile --show-stack-traces" 0

# Then
assert_directory_exists "artifacts-pvm"
assert_directory_exists "cache-pvm"
assert_directory_not_empty "artifacts-pvm"
assert_directory_not_empty "cache-pvm"

echo "Solidity compiles successfully in fixture-pojects/foo" \
    "creating the appropriate artifacts ✅"
