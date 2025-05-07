#!/usr/bin/env bash
set -euo pipefail

docker run --rm -i \
  -u "$(id -u):$(id -g)" \
  -v "$PWD":/workdir \
  -w /workdir \
  paritypr/substrate:latest \
  substrate "$@"