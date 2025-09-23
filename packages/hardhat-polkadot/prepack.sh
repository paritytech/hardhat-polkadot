#!/usr/bin/env sh

# fail if any commands fails
set -e

# 1) setup
mkdir -p .bundled/hardhat-polkadot-node
mkdir -p .bundled/hardhat-polkadot-resolc
mkdir -p .bundled/hardhat-polkadot-migrator
cp "./package.json" "./package.json.backup" # backup package.json
BUNDLED_DIR="$(pwd)/.bundled"

# 2) pack @parity/hardhat-polkadot-node
cd ../hardhat-polkadot-node
HARDHAT_POLKADOT_NODE_TGZ=$(pnpm pack --silent --pack-destination "$BUNDLED_DIR")

# 3) pack @parity/hardhat-polkadot-resolc
cd ../hardhat-polkadot-resolc
HARDHAT_POLKADOT_RESOLC_TGZ=$(pnpm pack --silent --pack-destination "$BUNDLED_DIR")

# 4) pack @parity/hardhat-polkadot-migrator
cd ../hardhat-polkadot-migrator
HARDHAT_POLKADOT_MIGRATOR_TGZ=$(pnpm pack --silent --pack-destination "$BUNDLED_DIR")

# 5) move prepacked to node_modules
cd ../hardhat-polkadot
pnpm add $HARDHAT_POLKADOT_NODE_TGZ
pnpm add $HARDHAT_POLKADOT_RESOLC_TGZ
pnpm add $HARDHAT_POLKADOT_MIGRATOR_TGZ