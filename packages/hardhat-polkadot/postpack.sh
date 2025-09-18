#!/usr/bin/env sh

# fail if any commands fails
set -e

# 1) restore package.json
cp "./package.json.backup" "./package.json"
rm "./package.json.backup"