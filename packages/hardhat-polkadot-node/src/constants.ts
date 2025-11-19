export const PLUGIN_NAME = "hardhat-polkadot-node"

export const TASK_NODE_POLKADOT = "node-polkadot"
export const TASK_NODE_POLKADOT_CREATE_SERVER = "node-polkadot:create-server"
export const TASK_NODE_POLKADOT_CREATE_ETH_ADAPTER = "node-polkadot:create-eth-adapter"
export const TASK_RUN_POLKADOT_NODE_IN_SEPARATE_PROCESS = "node-polkadot:run-in-separate-process"

export const PROCESS_TERMINATION_SIGNALS = ["SIGINT", "SIGTERM", "SIGKILL"]

export const NODE_START_PORT = 9944
export const ETH_RPC_ADAPTER_START_PORT = 8545
export const MAX_PORT_ATTEMPTS = 10
export const PORT_CHECK_DELAY = 500
export const RPC_ENDPOINT_PATH = "eth_chainId"
export const NODE_RPC_URL_BASE_URL = process.env.CI ? "0.0.0.0" : "host.docker.internal"

export const POLKADOT_TEST_NODE_NETWORK_NAME = "anvil"

export const BASE_URL = "http://127.0.0.1"
export const POLKADOT_NETWORK_ACCOUNTS = [
    "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133",
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
]

export const NETWORK_GAS = {
    AUTO: "auto",
}
export const NETWORK_GAS_PRICE = {
    AUTO: "auto",
}
export const NETWORK_ETH = {
    LOCALHOST: "localhost",
}
export const ETH_RPC_TO_SUBSTRATE_RPC: Record<string, string> = {
    "testnet-passet-hub-eth-rpc.polkadot.io": "wss://testnet-passet-hub.polkadot.io",
    "kusama-asset-hub-eth-rpc.polkadot.io": "wss://asset-hub-kusama-rpc.dwellir.com",
    "westend-asset-hub-eth-rpc.polkadot.io": "wss://asset-hub-westend-rpc.dwellir.com",
}
