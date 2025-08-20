# Dockerfile for Substrate node with console.sol precompile
FROM paritytech/ci-linux:production as builder

WORKDIR /substrate

# Copy the console precompile source
COPY ./src /substrate/frame/evm/precompile/console/src
COPY ./Cargo.toml /substrate/frame/evm/precompile/console/Cargo.toml

# Clone Substrate with Frontier
RUN git clone https://github.com/paritytech/substrate.git . && \
    git submodule update --init --recursive

# Add console precompile to the node runtime
RUN echo 'pallet-evm-precompile-console = { path = "../../frame/evm/precompile/console", default-features = false }' >> \
    bin/node/runtime/Cargo.toml

# Build the node
RUN cargo build --release --features=runtime-benchmarks

# Runtime stage
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /substrate/target/release/substrate /usr/local/bin/substrate

# Expose ports
EXPOSE 9944 9933 30333

# Default command
CMD ["substrate", "--dev", "--unsafe-rpc-external", "--rpc-cors=all"]