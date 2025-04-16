export const PLUGIN_NAME = 'hardhat-revive-node';

export const TASK_NODE_POLKAVM = 'node-polkavm';
export const TASK_NODE_POLKAVM_CREATE_SERVER = 'node-polkavm:create-server';
export const TASK_NODE_POLKAVM_CREATE_ETH_ADAPTER = 'node-polkavm:create-eth-adapter';
export const TASK_RUN_POLKAVM_NODE_IN_SEPARATE_PROCESS = 'node-polkavm:run-in-separate-process';

export const PROCESS_TERMINATION_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGKILL'];

export const NODE_START_PORT = 8000;
export const ETH_RPC_ADAPTER_START_PORT = 8545;
export const MAX_PORT_ATTEMPTS = 10;
export const PORT_CHECK_DELAY = 500;
export const RPC_ENDPOINT_PATH = 'eth_chainId';

export const POLKAVM_TEST_NODE_NETWORK_NAME = 'Kitchensink';

export const BASE_URL = `http://127.0.0.1`;
export const NETWORK_ACCOUNTS = {
    REMOTE: 'remote',
    POLKAVM: [
        '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133',
        '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5b0000a702133',
        '0x5fb92c48bebcd6e98884f76de468fa3f6278f880713595d45af5b0000a702133',
        '0x5fb92d6de468fa3f6278f8807c48bebc13595d45af5b000e98884f760a702133',
        '0x5fb92d6e98884f76de468fa3f6278f8807c48bebc130a702133595d45af5b000',
        '0x5fb92d6e98884f76de468fa3f6275af5b0000a7021bc338f8807c48be13595d4',
        '0x521338f8807c48befb92d6e98884f76de468fa3f6275af5b0000a70bc13595d4',
        '0x5fb92d6e9884f768de468fa3f6275af5b0000a7021338f8807c48bebc13595d4',
        '0x5fb92d6de468fa3f6275af5b0000a7021338f8807c48bebc13595d46e98884f7',
        '0x5fb92d6e98884f76de468fa3f6275af5b0000a7021338f8807c48be3595d4bc1',
    ]
};
export const NETWORK_GAS = {
    AUTO: 'auto',
};
export const NETWORK_GAS_PRICE = {
    AUTO: 'auto',
};
export const NETWORK_ETH = {
    LOCALHOST: 'localhost',
};

export const DEFAULT_TIMEOUT_MILISECONDS = 30000;
