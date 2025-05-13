#!/usr/bin/env sh

# fail if any commands fails
set -e

# 1) setup
mkdir -p node_modules/@parity/hardhat-polkadot-node
mkdir -p node_modules/@parity/hardhat-polkadot-resolc
mkdir -p .bundled/hardhat-polkadot-node
mkdir -p .bundled/hardhat-polkadot-resolc
BUNDLED_DIR="$(pwd)/.bundled"

# 2) pack @parity/hardhat-polkadot-node
cd ../hardhat-polkadot-node
HARDHAT_POLKADOT_NODE_TGZ=$(pnpm pack --silent --pack-destination "$BUNDLED_DIR")
tar --extract --file $HARDHAT_POLKADOT_NODE_TGZ --directory $BUNDLED_DIR/hardhat-polkadot-node

# 3) pack @parity/hardhat-polkadot-resolc
cd ../hardhat-polkadot-resolc
HARDHAT_POLKADOT_RESOLC_TGZ=$(pnpm pack --silent --pack-destination "$BUNDLED_DIR")
tar --extract --file $HARDHAT_POLKADOT_RESOLC_TGZ --directory $BUNDLED_DIR/hardhat-polkadot-resolc

# 4) move prepacked to node_modules
cd ../hardhat-polkadot
rm -rf node_modules/@parity/hardhat-polkadot-node
rm -rf node_modules/@parity/hardhat-polkadot-resolc
mv $BUNDLED_DIR/hardhat-polkadot-node/package node_modules/@parity/hardhat-polkadot-node
mv $BUNDLED_DIR/hardhat-polkadot-resolc/package node_modules/@parity/hardhat-polkadot-resolc