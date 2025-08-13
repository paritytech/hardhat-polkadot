#!/usr/bin/env bash

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cd ./lock # relative to tmp folder
npm add $HARDHAT_POLKADOT_TGZ_PATH
npm install # install modules specified in the package.json
cp ../basic-test-and-deploy.config.js ./hardhat.config.js

# When
RUN_TESTS_OUTPUT=$(npx hardhat test)

# Then
assert_directory_not_empty "artifacts-pvm"
assert_directory_not_empty "cache-pvm"
check_log_value "$RUN_TESTS_OUTPUT" "4 passing"
echo "Tests in local network run successfully in fixture-pojects/lock ✅"

# Given
cp ../forking.config.js ./hardhat.config.js

# When
RUN_TESTS_OUTPUT=$(npx hardhat test)

# Then
check_log_value "$RUN_TESTS_OUTPUT" "4 passing"
echo "Tests in forked network run successfully in fixture-pojects/lock ✅"