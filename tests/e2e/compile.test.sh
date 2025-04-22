#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cd ./compile # relative to tmp folder
echo $HARDHAT_POLKADOT_PACKAGE_PATH
npm add $HARDHAT_POLKADOT_PACKAGE_PATH >/dev/null 2>&1
echo "jhdh"
npm install >/dev/null 2>&1 # install modules specified in the package.json

# When
echo "Solidity compiles successfully in fixture-pojects/compile" \
    "creating the appropriate artifacts"
run_test_and_handle_failure "npx hardhat compile" 0

# Then
assert_directory_exists "artifacts-pvm"
assert_directory_exists "cache-pvm"
assert_directory_not_empty "artifacts-pvm"
assert_directory_not_empty "cache-pvm"