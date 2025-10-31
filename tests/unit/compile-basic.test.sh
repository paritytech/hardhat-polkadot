#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cp ./basic-compile.config.js ./foo/hardhat.config.js # relative to tmp folder
cd ./foo # relative to tmp folder
npm add "$HARDHAT_POLKADOT_TGZ_PATH"
npm install # install modules specified in the package.json

# When
run_test_and_handle_failure "npx hardhat compile --show-stack-traces" 0

# Then
assert_directory_exists "artifacts"
assert_directory_exists "cache"
assert_directory_not_empty "artifacts"
assert_directory_not_empty "cache"

echo "Solidity compiles successfully in fixture-pojects/foo" \
    "creating the appropriate artifacts ✅"
