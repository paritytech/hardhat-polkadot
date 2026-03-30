import "hardhat/types/config"
import type { TargetVM } from "./types.js"

declare module "hardhat/types/config" {
    interface EdrNetworkUserConfig {
        // Replace EVM-compatible node with polkadot-compatible node
        polkadot?: boolean | TargetVM
        // Configuration for polkadot-compatible node
        nodeConfig?: {
            // Use anvil-polkadot as the node - default: true
            useAnvil?: boolean
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
        // Configuration for polkadot-compatible ETH-RPC adapter
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
        polkadot?: boolean | TargetVM
    }

    interface EdrNetworkConfig {
        polkadot?: boolean | TargetVM
        url?: string
        polkadotUrl?: string
        nodeConfig?: {
            useAnvil?: boolean
            nodeBinaryPath?: string
            rpcPort?: number
            dev?: boolean
            consensus?: {
                seal?: "Instant" | "Manual" | "None"
                period?: string | number
            }
        }
        adapterConfig?: {
            adapterBinaryPath?: string
            adapterPort?: number
            dev?: boolean
            buildBlockMode?: "Instant" | "Manual" | "Batch"
        }
        docker?: boolean | string
    }

    interface HttpNetworkConfig {
        polkadot?: boolean | TargetVM
        ethNetwork?: string
        polkadotUrl?: string
    }
}
