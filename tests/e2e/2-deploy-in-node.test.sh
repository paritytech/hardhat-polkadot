#!/usr/bin/env bash

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

run_test() {
  # Given
  PROJECT_DIR=$1
  CONFIG_FILE=$2
  CONTRACT_NAME=$3
  NETWORK_NAME=$4
  CHAIN_ID=$5
  cd "$TMP_TESTS_DIR/$PROJECT_DIR"
  cp "../$CONFIG_FILE" ./hardhat.config.js
  npm add "$HARDHAT_POLKADOT_TGZ_PATH"
  npm install
  await_start_node

  # When
  DEPLOY_LOCAL_NODE_OUTPUT=$(yes | npx hardhat ignition deploy "./ignition/modules/${CONTRACT_NAME}.js" --network localNode)

  # Then
  assert_directory_not_empty "artifacts-pvm"
  assert_directory_not_empty "cache-pvm"
  check_log_value "$DEPLOY_LOCAL_NODE_OUTPUT" "${CONTRACT_NAME}Module#${CONTRACT_NAME} - 0x"
  echo "Deploys on $NETWORK_NAME network successfully in fixture-projects/${PROJECT_DIR} ✅"

  # Clean
  npx hardhat ignition wipe chain-$CHAIN_ID "${CONTRACT_NAME}Module#${CONTRACT_NAME}"
}

run_test "lock" "basic-test-and-deploy.config.js" "Lock" "local-node" 420420420
run_test "lock" "forking.config.js" "Lock" "forked-node" 420420422