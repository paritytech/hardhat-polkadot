import { spawn, StdioOptions } from "child_process"
import chalk from "chalk"
import { run } from "run-container"
import Docker from "dockerode"
import { ETH_RPC_ADAPTER_START_PORT, RPC_ENDPOINT_PATH, NODE_RPC_URL_BASE_URL } from "../constants"
import { waitForServiceToBeReady } from "../utils"
import { Service } from "./index"

const ADAPTER_CONTAINER_NAME = "eth-rpc"

export class EthRpcService extends Service {
    public port: number

    constructor(commandArgs: string[] = [], blockProcess: boolean = true) {
        super(commandArgs, blockProcess)

        const portArg = this.commandArgs.find((arg) => arg.startsWith("--rpc-port="))
        this.port = portArg ? parseInt(portArg.split("=")[1], 10) : ETH_RPC_ADAPTER_START_PORT
    }

    public async from_binary(pathToBinary: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let stdioConfig: StdioOptions = "inherit"
            if (!this.blockProcess) {
                // Use "ignore" to prevent stdout/stderr from being piped into an in-memory buffer,
                // which could fill up and block the child process.
                stdioConfig = ["ignore", "ignore", "ignore"]
            }

            if (this.blockProcess) {
                console.info(chalk.green(`Starting the Eth RPC Adapter at 127.0.0.1:${this.port}`))
                console.info(
                    chalk.green(`Running command: ${pathToBinary} ${this.commandArgs.join(" ")}`),
                )
            }

            this.process = spawn(pathToBinary, this.commandArgs, { stdio: stdioConfig })

            this.process.on("error", this._handleOnError("Eth RPC Adapter", reject))
            this.process.on("exit", this._handleOnExit("Eth RPC Adapter"))

            if (!this.blockProcess) {
                resolve()
            }
        })
    }

    public async from_docker(docker: Docker, nodePort: number): Promise<void> {
        // TODO: use latestImage once it is more stable
        // const imageTag = await getLatestImageName(ADAPTER_CONTAINER_NAME)
        const imageTag = "master-87a8fb03"

        const container = docker.getContainer(ADAPTER_CONTAINER_NAME)
        await container
            .inspect()
            .then(() => container.remove({ force: true }))
            .catch(() => {})

        this.container = await run({
            Image: `paritypr/eth-rpc:${imageTag}`,
            name: ADAPTER_CONTAINER_NAME,
            HostConfig: {
                NetworkMode: process.env.CI ? "host" : undefined,
                AutoRemove: true,
                PortBindings: process.env.CI
                    ? undefined
                    : {
                          [`${this.port}/tcp`]: [{ HostPort: `${this.port}` }],
                      },
            },
            ExposedPorts: {
                [`${this.port}/tcp`]: {},
            },
            Cmd: [
                "--dev",
                "--rpc-port",
                `${this.port}`,
                "--node-rpc-url",
                `ws://${NODE_RPC_URL_BASE_URL}:${nodePort}`,
                "--unsafe-rpc-external",
                "--rpc-cors",
                "all",
            ],
            Tty: false,
            Env: [],
        })

        // remove container when process exits
        ;["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM"].forEach((e) => {
            process.on(
                e,
                async () =>
                    await this.container!.remove({ force: true }).then(() => process.exit(0)),
            )
        })

        if (this.blockProcess) {
            console.info(chalk.green(`Starting the Eth RPC Adapter at 127.0.0.1:${this.port}`))
            await this.container.wait()
        }
    }

    public async stop(): Promise<void> {
        if (this.process && !this.process.killed) {
            this.process.kill()
        }

        if (this.container) {
            await this.container.remove({ force: true })
        }
    }

    async waitForEthRpcToBeReady(maxAttempts = 20): Promise<void> {
        const payload = {
            jsonrpc: "2.0",
            method: RPC_ENDPOINT_PATH,
            params: [],
            id: 1,
        }
        await waitForServiceToBeReady(this.port, payload, maxAttempts)
    }
}
