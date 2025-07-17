import "hardhat/types/config"

declare module "hardhat/types/config" {
    interface HardhatNetworkUserConfig {
        // Replace EVM-compatible node with PolkaVM-compatible node
        polkavm?: boolean
        // Configuration for PolkaVM-compatible node
        nodeConfig?: {
            // Path to the substrate node binary
            nodeBinaryPath?: string
            // Port ETH-RPC adapter binary
            rpcPort?: number
            // Enable node in development mode
            dev?: boolean
            // Only if using `revive-dev-node`
            consensus?: {
                seal?: "Instant" | "Manual" | "None"
                period?: string | number
            }
        }
        // Configuration for PolkaVM-compatible ETH-RPC adapter
        adapterConfig?: {
            // Path to the eth-rpc-adapter binary
            adapterBinaryPath?: string
            // Port where the adapter will listen on - default: 8545
            adapterPort?: number
            // Whether to run the adapter in dev mode - default: false
            dev?: boolean
            // Build block mode when forking
            buildBlockMode?: "Instant" | "Manual" | "Batch"
        }
        /**
         * Use `nodeConfig` and `adapterConfig` via Docker instead of local
         * binaries (`nodeBinaryPath` and `adapterBinaryPath`) - default: false
         *
         * - true: uses default sockets paths "/var/run/docker.sock" or "~/.docker/run/docker.sock"
         * - string: custom socket path
         * - false: disable
         */
        docker?: boolean | string
    }

    interface HttpNetworkUserConfig {
        polkavm?: boolean
    }

    interface HardhatNetworkConfig {
        polkavm?: boolean
        url?: string
    }

    interface HttpNetworkConfig {
        polkavm?: boolean
        ethNetwork?: string
    }
}

declare module "hardhat/types/runtime" {
    interface Network {
        polkavm?: boolean
    }
}
