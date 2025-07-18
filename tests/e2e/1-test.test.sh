#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cp ./basic-test-and-deploy.config.js ./lock/hardhat.config.js
cd ./lock # relative to tmp folder
npm add $HARDHAT_POLKADOT_TGZ_PATH
npm install # install modules specified in the package.json

# When
RUN_TESTS_OUTPUT=$(npx hardhat test)

# Then
assert_directory_not_empty "artifacts-pvm"
assert_directory_not_empty "cache-pvm"
check_log_value "$RUN_TESTS_OUTPUT" "4 passing"

echo "Tests run successfully in fixture-pojects/lock ✅"