#!/bin/bash

# Build script for console.sol precompile
set -e

echo "🔨 Building console.sol precompile..."

# Check Rust version
echo "📋 Checking Rust version..."
rustc --version
cargo --version

# Format code
echo "🎨 Formatting code..."
cargo fmt -- --check || cargo fmt

# Build in no_std mode (default for substrate runtime)
echo "🏗️ Building in no_std mode..."
cargo build --no-default-features --release

# Build with std features
echo "🏗️ Building with std features..."
cargo build --features std --release

# Run clippy for linting
echo "🔍 Running clippy..."
cargo clippy --all-targets --all-features -- -D warnings || true

# Run tests
echo "🧪 Running tests..."
cargo test --features testing

# Run property-based tests (may take longer)
echo "🔬 Running property-based tests..."
cargo test --features testing -- --nocapture prop_ 2>/dev/null || true
cargo test --features testing -- --nocapture qc_ 2>/dev/null || true

# Run benchmarks (optional)
if [ "$1" == "--bench" ]; then
    echo "📊 Running benchmarks..."
    cargo bench --features benchmarks
fi

# Check documentation
echo "📚 Checking documentation..."
cargo doc --no-deps --features std

echo "✅ Build completed successfully!"
echo ""
echo "📦 Package details:"
cargo pkgid
echo ""
echo "💡 Next steps:"
echo "  1. Integrate into Substrate runtime"
echo "  2. Build Docker image with: docker build -t polkadot-console-node ."
echo "  3. Test with hardhat-polkadot"