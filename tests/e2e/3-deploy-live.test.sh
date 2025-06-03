#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cp ./simple-local-test-deploy.config.js ./lock/hardhat.config.js
cd ./lock # relative to tmp folder
npm add $HARDHAT_POLKADOT_TGZ_PATH
npm install # install modules specified in the package.json

# When
DEPLOY_LIVE_NETWORK_OUTPUT=$(yes | npx hardhat ignition deploy ./ignition/modules/Lock.js --network passetHub)

# Then
assert_directory_not_empty "artifacts-pvm"
assert_directory_not_empty "cache-pvm"
check_log_value "$DEPLOY_LIVE_NETWORK_OUTPUT" "LockModule#Lock - 0x"

echo "Deploys on live network successfully in fixture-pojects/lock ✅"