#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

run_test() {
  # Given
  PROJECT_DIR=$1
  CONFIG_FILE=$2
  EXPECTED_PASSING=$3
  NETWORK_NAME=$4
  echo "Running test in fixture-projects/$PROJECT_DIR for ${CONFIG_FILE}; network ${NETWORK_NAME}"

  cd "$TMP_TESTS_DIR/$PROJECT_DIR"
  pnpm add "$HARDHAT_POLKADOT_NODE_TGZ_PATH"
  pnpm add "$HARDHAT_POLKADOT_RESOLC_TGZ_PATH"
  pnpm add "$HARDHAT_POLKADOT_TGZ_PATH"
  pnpm install
  cp "../$CONFIG_FILE" ./hardhat.config.js

  # When
  RUN_TESTS_OUTPUT="$(npx hardhat test --show-stack-traces)"

  # Then
  assert_directory_not_empty "artifacts-pvm"
  assert_directory_not_empty "cache-pvm"
  check_log_value "$RUN_TESTS_OUTPUT" "$EXPECTED_PASSING passing"
  echo "✅ Tests in $NETWORK_NAME network passed in fixture-projects/$PROJECT_DIR"
}

run_test "lock" "basic-test-and-deploy.config.js" "9" "memory-node"
run_test "lock" "forking.config.js" "9" "memory-forked"
run_test "factory" "basic-test-and-deploy.config.js" "2" "memory-node"

