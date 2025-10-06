#!/usr/bin/env sh

set -e # Fail if any command fails
. ./helpers.sh  # import helpers functions inside tmp folder

test_port_cmd() {
  # Given
  PROJECT_DIR=$1
  contents() {
    echo "$(cat $TMP_TESTS_DIR/$PROJECT_DIR/$1 2>&1 || true)"
  }
  assert_content_updated() {
    local before="$1"
    local file="$2"
    if [ "$before" = "$(contents $file)" ]; then
      echo "Expected $file to be updated, but it wasn't"
      exit 1
    fi
  }
  GIGNORE_BEFORE=$(contents .gitignore)
  PKG_BEFORE=$(contents package.json)
  HH_CONFIG_BEFORE=$(contents hardhat.config.*)


  cd "$TMP_TESTS_DIR/$PROJECT_DIR"
  npm add "$HARDHAT_POLKADOT_TGZ_PATH"
  npm install

  # When
  OUTPUT="$(npx hardhat-polkadot port ./hello -y)"

  # Then
  assert_content_updated "$GIGNORE_BEFORE" ".gitignore"
  assert_content_updated "$PKG_BEFORE" "package.json"
  assert_content_updated "$HH_CONFIG_BEFORE" "hardhat.config.ts"
  echo "Successfully ported project in fixture-projects/${PROJECT_DIR} ✅"
}

test_port_cmd 'test-port-command/scenario-1'
test_port_cmd 'test-port-command/scenario-2'