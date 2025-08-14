#!/usr/bin/env bash

# fail if any commands fails
set -e

print_error_msg() {
  echo "\033[31mERROR: $1\033[0m"
}

run_test_and_handle_failure() {
  # $1 command to execute
  # $2 expected exit code
  # $3 additional error message

  command_to_execute="$1"
  expected_exit_code="$2"
  additional_error_message="$3"

  if [ "$expected_exit_code" -eq "0" ]; then
    # the command should be executed successfully
    if ! $command_to_execute >stdout 2>stderr; then
      print_error_msg "The command failed.\nOutput:'$(cat stdout)'\nError: '$(cat stderr)'\n$additional_error_message"
      exit 1
    fi
  else
    # the command should fail
    if $command_to_execute >stdout 2>stderr; then
      print_error_msg "The command should have failed.\nOutput:'$(cat stdout)'\nError: '$(cat stderr)'\n$additional_error_message"
      exit 1
    fi
  fi
}

assert_directory_exists() {
  if [ ! -d "$1" ]; then
    echo "Expected directory $1 to exist, but it doesn't"
    exit 1
  fi
}

assert_directory_doesnt_exist() {
  if [ -d "$1" ]; then
    echo "Expected directory $1 to not exist, but it does"
    exit 1
  fi
}

assert_directory_empty() {
  if [ "$(ls -A $1)" ]; then
    echo "Expected directory $1 to be empty, but it isn't"
    exit 1
  fi
}

assert_directory_not_empty() {
  if [ ! "$(ls -A $1)" ]; then
    echo "Expected directory $1 to not be empty, but it is"
    exit 1
  fi
}

check_log_value() {
    local output="$1"
    local expected_value="$2"
    
    echo "$output"

    if echo "$output" | grep -q "$expected_value"; then
      :
    else
        echo "Expected log to contain '$expected_value'. Log output: '$output'"
        exit 1
    fi
}

await_start_node() {
  local UNIQUE_NODE_LOG="$1"
  
  # Start the Hardhat node in the background
  npx hardhat node > hardhat-node.log 2>&1 & 
  HARDHAT_NODE_PID=$!

  # Wait until node is ready, depending on the node
  echo "Waiting for node log: $UNIQUE_NODE_LOG"
  tail -n 0 -F hardhat-node.log | while read -r line; do
    echo "$line"
    if [[ "$line" == *"$UNIQUE_NODE_LOG"* ]]; then
      echo "Node ready (PID: $HARDHAT_NODE_PID)"
      pkill -P $$ tail # kill the tail from this subshell
      break
    fi
  done

  # Wait until eth-rpc is ready
  for i in $(seq 1 60); do
    result=$(curl -sS -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":2}' \
      http://127.0.0.1:8545 | sed -nE 's/.*"result":"0x([0-9a-fA-F]+)".*/\1/p')
    [ -n "$result" ] && [ $((16#$result)) -ge 5 ] && break || sleep 1
  done
}

stop_node() {
  # if docker process
  docker ps --format '{{.ID}} {{.Ports}}' \
  | awk '/:8000->/ {print $1}' \
  | xargs -r docker rm -f

  # if node process
  lsof -nP -iTCP:8000 -sTCP:LISTEN -t 2>/dev/null | xargs -r kill -INT
}