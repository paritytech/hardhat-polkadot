import axios from 'axios';
import net from 'net';
import { createProvider } from 'hardhat/internal/core/providers/construction';
import type { HardhatConfig } from 'hardhat/types';

import {
    BASE_URL,
    MAX_PORT_ATTEMPTS,
    NETWORK_ACCOUNTS,
    NETWORK_ETH,
    NETWORK_GAS,
    NETWORK_GAS_PRICE,
    NODE_START_PORT,
    ETH_RPC_ADAPTER_START_PORT,
    POLKADOT_TEST_NODE_NETWORK_NAME,
    RPC_ENDPOINT_PATH,
} from './constants';
import { PolkadotNodePluginError } from './errors';
import type { CliCommands, CommandArguments, SplitCommands } from './types';
import { JsonRpcServer } from './server';

export function constructCommandArgs(args?: CommandArguments, cliCommands?: CliCommands): SplitCommands {
    const nodeCommands: string[] = [];
    const adapterCommands: string[] | undefined = [];

    if (cliCommands && Object.values(cliCommands).find((v) => v !== undefined)) {
        if (cliCommands.fork) {
            nodeCommands.push(`npx`);
            nodeCommands.push(`@acala-network/chopsticks@latest`);

            nodeCommands.push(`--endpoint=${cliCommands.fork}`);
        } else if (cliCommands.nodeBinaryPath) {
            nodeCommands.push(cliCommands.nodeBinaryPath);
        }
        if (cliCommands.rpcPort) {
            nodeCommands.push(`--rpc-port=${cliCommands.rpcPort}`);
        }

        if (cliCommands.adapterEndpoint) {
            adapterCommands.push(`--node-rpc-url=${cliCommands.adapterEndpoint}`);
        } else {
            adapterCommands.push(`--node-rpc-url=ws://localhost:8000`);
        }

        if (cliCommands.adapterPort && cliCommands.adapterPort !== cliCommands.rpcPort) {
            adapterCommands.push(`--rpc-port=${cliCommands.adapterPort}`);
        } else if (cliCommands.adapterPort && cliCommands.adapterPort === cliCommands.rpcPort) {
            throw new PolkadotNodePluginError('Adapter and node cannot share the same port.');
        }

        if (cliCommands.fork) {
            nodeCommands.push(`--build-block-mode=${cliCommands.buildBlockMode || 'Instant'}`);
        }

        if (cliCommands.dev) {
            adapterCommands.push('--dev');
            if (cliCommands.nodeBinaryPath) {
                nodeCommands.push('--dev');
            }
        }
    }

    if (args && Object.values(args).find((v) => v !== undefined)) {
        if (args.forking && !cliCommands?.fork) {
            nodeCommands.push(`npx`);
            nodeCommands.push(`@acala-network/chopsticks@latest`);

            nodeCommands.push(`--endpoint=${args.forking.url}`);
        } else if (args.nodeCommands?.nodeBinaryPath && !cliCommands?.nodeBinaryPath) {
            nodeCommands.push(args.nodeCommands?.nodeBinaryPath);
        } else {
            throw new PolkadotNodePluginError('Binary path not specified.');
        }

        if (args.nodeCommands?.rpcPort && !cliCommands?.rpcPort) {
            nodeCommands.push(`--rpc-port=${args.nodeCommands.rpcPort}`);
        }

        if (args.adapterCommands?.adapterEndpoint && !cliCommands?.adapterEndpoint) {
            adapterCommands.push(`--node-rpc-url=${args.adapterCommands.adapterEndpoint}`);
        } else if (!cliCommands?.adapterEndpoint) {
            adapterCommands.push(`--node-rpc-url=ws://localhost:8000`);
        }

        if (args.adapterCommands?.adapterPort && args.adapterCommands?.adapterPort !== args.nodeCommands?.rpcPort) {
            adapterCommands.push(`--rpc-port=${args.adapterCommands.adapterPort}`);
        } else if (
            args.adapterCommands?.adapterPort &&
            args.adapterCommands?.adapterPort === args.nodeCommands?.rpcPort
        ) {
            throw new PolkadotNodePluginError('Adapter and node cannot share the same port.');
        }
        if (args.forking && !cliCommands?.buildBlockMode) {
            nodeCommands.push(`--build-block-mode=${args.adapterCommands?.buildBlockMode || 'Instant'}`);
        }

        if (args.nodeCommands?.nodeBinaryPath && args.nodeCommands.dev && !cliCommands?.dev) {
            nodeCommands.push(`--dev`);
        }

        if (args.adapterCommands?.dev && !cliCommands?.dev) {
            adapterCommands.push('--dev');
        }
    }

    return {
        nodeCommands,
        adapterCommands,
    };
}

async function isPortAvailableForIP(port: number, ip: string): Promise<boolean> {
    return new Promise((resolve) => {
        const tester: net.Server = net
            .createServer()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .once('error', (err: any) => resolve(err.code !== 'EADDRINUSE'))
            .once('listening', () => tester.close(() => resolve(true)))
            .listen(port, ip);
    });
}

export async function isPortAvailable(port: number): Promise<boolean> {
    const availableIPv4 = await isPortAvailableForIP(port, '0.0.0.0');
    const availableIPv6 = await isPortAvailableForIP(port, '::');
    return availableIPv4 && availableIPv6;
}

function setPayload(adapter?: boolean): object {
    return {
        jsonrpc: '2.0',
        method: adapter ? RPC_ENDPOINT_PATH : 'state_getRuntimeVersion',
        params: [],
        id: 1,
    };
}

export async function waitForNodeToBeReady(
    port: number,
    adapter: boolean = false,
    maxAttempts: number = 20,
): Promise<void> {
    const rpcEndpoint = `http://127.0.0.1:${port}`;

    const payload = setPayload(adapter);

    let attempts = 0;
    let waitTime = 1000;
    const backoffFactor = 2;
    const maxWaitTime = 30000;

    while (attempts < maxAttempts) {
        try {
            const response = await axios.post(rpcEndpoint, payload);

            if (response.status == 200) {
                return;
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (_e: any) {
            // If it fails, it will just try again
        }

        attempts++;

        await new Promise((r) => setTimeout(r, waitTime));

        waitTime = Math.min(waitTime * backoffFactor, maxWaitTime);
    }

    throw new PolkadotNodePluginError("Server didn't respond after multiple attempts");
}

export async function getAvailablePort(startPort: number, maxAttempts: number): Promise<number> {
    let currentPort = startPort;
    for (let i = 0; i < maxAttempts; i++) {
        if (await isPortAvailable(currentPort)) {
            return currentPort;
        }
        currentPort++;
    }
    throw new PolkadotNodePluginError("Couldn't find an available port after several attempts");
}

export function adjustTaskArgsForPort(taskArgs: string[], currentPort: number): string[] {
    const portArg = '--port';
    const portArgIndex = taskArgs.indexOf(portArg);
    if (portArgIndex !== -1) {
        if (portArgIndex + 1 < taskArgs.length) {
            taskArgs[portArgIndex + 1] = `${currentPort}`;
        } else {
            throw new PolkadotNodePluginError(
                'Invalid task arguments: --port provided without a following port number.',
            );
        }
    } else {
        taskArgs.push(portArg, `${currentPort}`);
    }
    return taskArgs;
}

export function getNetworkConfig(url: string, chainId?: number) {
    return {
        accounts: NETWORK_ACCOUNTS.POLKADOT,
        gas: NETWORK_GAS.AUTO,
        gasPrice: NETWORK_GAS_PRICE.AUTO,
        gasMultiplier: 1,
        httpHeaders: {},
        timeout: 20000,
        url,
        ethNetwork: NETWORK_ETH.LOCALHOST,
        chainId: chainId || 420420421,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function configureNetwork(config: HardhatConfig, network: any, port: number) {
    const url = `${BASE_URL}:${port}`;
    const payload = setPayload(true);
    let chainId = 0;
    try {
        const response = await axios.post(url, payload);

        if (response.status == 200) {
            chainId = parseInt(response.data.result);
        }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (_e: any) {
        // If it fails, it will just try again
    }

    network.name = POLKADOT_TEST_NODE_NETWORK_NAME;
    network.config = getNetworkConfig(url, chainId);
    config.networks[network.name] = network.config;
    network.provider = await createProvider(config, network.name);
}

export async function startServer(commands: CommandArguments, nodePath?: string, adapterPath?: string) {
    const currentNodePort = await getAvailablePort(
        commands.nodeCommands?.rpcPort ? commands.nodeCommands.rpcPort : NODE_START_PORT,
        MAX_PORT_ATTEMPTS,
    );
    const currentAdapterPort = await getAvailablePort(
        commands.adapterCommands?.adapterPort ? commands.adapterCommands.adapterPort : ETH_RPC_ADAPTER_START_PORT,
        MAX_PORT_ATTEMPTS,
    );
    const updatedCommands = Object.assign({}, commands, {
        nodeCommands: { port: currentNodePort },
        adapterCommands: { adapterPort: currentAdapterPort },
    });
    const commandArgs = constructCommandArgs(updatedCommands);

    return {
        commandArgs,
        server: new JsonRpcServer(nodePath, adapterPath),
        port: currentAdapterPort,
    };
}
