#!/usr/bin/env bash

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

run_test() {
  # Given
  PROJECT_DIR=$1
  CONFIG_FILE=$2
  UNIQUE_NODE_LOG=$3
  CONTRACT_NAME=$4
  NETWORK_NAME=$5
  CHAIN_ID=$6
  stop_node
  cd "$TMP_TESTS_DIR/$PROJECT_DIR"
  cp "../$CONFIG_FILE" ./hardhat.config.js
  pnpm add "$HARDHAT_POLKADOT_NODE_TGZ_PATH"
  pnpm add "$HARDHAT_POLKADOT_RESOLC_TGZ_PATH"
  pnpm add "$HARDHAT_POLKADOT_TGZ_PATH"
  pnpm install
  await_start_node "$UNIQUE_NODE_LOG" # careful chopsticks uses ANSI color codes

  # When
  DEPLOY_LOCAL_NODE_OUTPUT=$(yes | npx hardhat ignition deploy "./ignition/modules/${CONTRACT_NAME}.js" --network localNode)

  # Then
  assert_directory_not_empty "artifacts-pvm"
  assert_directory_not_empty "cache-pvm"
  check_log_value "$DEPLOY_LOCAL_NODE_OUTPUT" "${CONTRACT_NAME}Module#${CONTRACT_NAME} - 0x"
  echo "Deploys on $NETWORK_NAME network successfully in fixture-projects/${PROJECT_DIR} ✅"

  # Clean
  npx hardhat ignition wipe chain-$CHAIN_ID "${CONTRACT_NAME}Module#${CONTRACT_NAME}"
  stop_node
}

run_test "lock" "basic-test-and-deploy.config.js" "Imported #5" "Lock" "local-node" 420420420
run_test "lock" "forking.config.js" '"chopsticks"' "Lock" "forked-node" 420420422
