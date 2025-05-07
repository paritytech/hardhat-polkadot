#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cp ./test-without-node.config.js ./lock/hardhat.config.js
cd ./lock # relative to tmp folder
npm add $HARDHAT_POLKADOT_PACKAGE_PATH >/dev/null 2>&1
npm install >/dev/null 2>&1 # install modules specified in the package.json

# When
run_test_and_handle_failure "npx hardhat test" 0

# Then
assert_directory_exists "artifacts-pvm"
assert_directory_exists "cache-pvm"
assert_directory_not_empty "artifacts-pvm"
assert_directory_not_empty "cache-pvm"

echo "Tests run successfully in fixture-pojects/lock ✅"