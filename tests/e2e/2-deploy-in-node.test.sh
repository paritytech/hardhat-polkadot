#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh # import helpers functions inside tmp folder

run_test() {
  # Given
  PROJECT_DIR=$1
  CONFIG_FILE=$2
  CONTRACT_NAME=$3
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
  npx hardhat ignition wipe chain-420420420 "${CONTRACT_NAME}Module#${CONTRACT_NAME}" # clean
  
  echo "Deploys on local node successfully in fixture-projects/${PROJECT_DIR} ✅"
}

# run_test "lock" "basic-test-and-deploy.config.js" "Lock"
run_test "lock" "forking.config.js" "Lock"