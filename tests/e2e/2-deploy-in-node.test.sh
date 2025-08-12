#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

run_test() {
  # Given
  PROJECT_DIR=$1
  CONFIG_FILE=$2
  CONTRACT_NAME=$3
  CHAIN_ID=$4
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

  # Clean
  npx hardhat ignition wipe chain-$CHAIN_ID "${CONTRACT_NAME}Module#${CONTRACT_NAME}"
  kill "$HARDHAT_NODE_PID" >/dev/null 2>&1 || true
  wait "$HARDHAT_NODE_PID" 2>/dev/null || true
  echo "Deploys on local node successfully in fixture-projects/${PROJECT_DIR} ✅"
}

run_test "lock" "basic-test-and-deploy.config.js" "Lock" 420420420
run_test "lock" "forking.config.js" "Lock" 420420422