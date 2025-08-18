#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

# Given
cp ./multiple-compile.config.js ./foo/hardhat.config.js # relative to tmp folder
cd ./foo # relative to tmp folder
npm add "$HARDHAT_POLKADOT_NODE_TGZ_PATH"
npm add "$HARDHAT_POLKADOT_RESOLC_TGZ_PATH"
npm add "$HARDHAT_POLKADOT_TGZ_PATH"
npm install # install modules specified in the package.json

# When/Then
run_test_and_handle_failure "npx hardhat compile --show-stack-traces" 0

echo "Multiple solidity versions compile successfully in fixture-projects/foo" \
    "creating the appropriate artifacts ✅"
