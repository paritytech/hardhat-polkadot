#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cp ./basic-test-and-deploy.config.js ./lock/hardhat.config.js
cd ./lock # relative to tmp folder
npm add "$HARDHAT_POLKADOT_NODE_TGZ_PATH"
npm add "$HARDHAT_POLKADOT_RESOLC_TGZ_PATH"
npm add "$HARDHAT_POLKADOT_TGZ_PATH"
npm install # install modules specified in the package.json
lsof -ti tcp:8000 | xargs -r kill -9
npx hardhat node > hardhat-node.log 2>&1 & # Start the Hardhat node in the background
HARDHAT_NODE_PID=$!
while ! grep -q "Imported #5" hardhat-node.log; do  # Wait until producing blocks appears
  tail -n 10 hardhat-node.log
  sleep 1
done
trap "kill $HARDHAT_NODE_PID" EXIT

# When
DEPLOY_LOCAL_NODE_OUTPUT=$(yes | npx hardhat ignition deploy ./ignition/modules/Lock.js --network localNode)

# Then
assert_directory_not_empty "artifacts-pvm"
assert_directory_not_empty "cache-pvm"
check_log_value "$DEPLOY_LOCAL_NODE_OUTPUT" "LockModule#Lock - 0x"

echo "Deploys on local node successfully in fixture-pojects/lock ✅"
