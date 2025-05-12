#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cp ./simple-local-test-deploy.config.js ./lock/hardhat.config.js
cd ./lock # relative to tmp folder
npm add $HARDHAT_POLKADOT_PACKAGE_PATH >/dev/null 2>&1
npm install >/dev/null 2>&1 # install modules specified in the package.json

# When
npx hardhat test  > test.log 2>&1
RUN_TESTS_OUTPUT=$(<test.log)

# Then
assert_directory_not_empty "artifacts-pvm"
assert_directory_not_empty "cache-pvm"
check_log_value "$RUN_TESTS_OUTPUT" "4 passing"

echo "Tests run successfully in fixture-pojects/lock ✅"