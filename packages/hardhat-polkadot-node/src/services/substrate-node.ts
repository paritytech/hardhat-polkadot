import { spawn, StdioOptions } from "child_process"
import chalk from "chalk"
import { runSimple } from "run-container"
import Docker from "dockerode"

import { NODE_START_PORT, RPC_ENDPOINT_PATH } from "../constants.js"
import { waitForServiceToBeReady, getLatestImageName } from "../utils.js"
import { Service } from "./service.js"

const SUBSTRATE_NODE_CONTAINER_NAME = "substrate"

export class SubstrateNodeService extends Service {
    public port: number
    private useAnvil: boolean

    constructor(
        commandArgs: string[] = [],
        blockProcess: boolean = true,
        useAnvil: boolean = true,
    ) {
        super(commandArgs.slice(1), blockProcess)
        this.useAnvil = useAnvil

        const portArg = commandArgs.find((arg) => arg.startsWith("--rpc-port="))
        this.port = portArg
            ? parseInt(portArg.split("=")[1], 10)
            : useAnvil
              ? 8545
              : NODE_START_PORT
    }

    public async from_binary(pathToBinary: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.blockProcess) {
                console.info(chalk.green(`Starting server at 127.0.0.1:${this.port}`))
                console.info(
                    chalk.green(`Running command: ${pathToBinary} ${this.commandArgs.join(" ")}`),
                )
            }

            let stdioConfig: StdioOptions = "inherit"
            if (!this.blockProcess) {
                // Use "ignore" to prevent stdout/stderr from being piped into an in-memory buffer,
                // which could fill up and block the child process.
                stdioConfig = ["ignore", "ignore", "ignore"]
            }

            this.process = spawn(pathToBinary, this.commandArgs, { stdio: stdioConfig })

            this.process.on("error", this._handleOnError("substrate node", reject))
            this.process.on("exit", this._handleOnExit("substrate node"))

            if (!this.blockProcess) {
                resolve()
            }
        })
    }

    public async from_docker(docker: Docker): Promise<void> {
        const imageTag = await getLatestImageName(SUBSTRATE_NODE_CONTAINER_NAME)

        const container = docker.getContainer(SUBSTRATE_NODE_CONTAINER_NAME)
        await container
            .inspect()
            .then(() => container.remove({ force: true }))
            .catch((err: any) => {
                if (err.statusCode !== 404) throw err
            })

        this.container = await runSimple({
            name: SUBSTRATE_NODE_CONTAINER_NAME,
            image: `paritypr/substrate:${imageTag}`,
            autoRemove: true,
            ports: {
                [`${this.port}/tcp`]: `${this.port}`,
            },
            cmd: ["--dev", "--rpc-port", `${this.port}`, "--unsafe-rpc-external"],
            verbose: true,
        })

        // remove container when process exits
        for (const sig of ["SIGINT", "SIGTERM"] as const) {
            process.once(sig, () => {
                this.container?.stop({ t: 2 }).catch(() => {}).finally(() => process.exit(0))
            })
        }

        if (this.blockProcess) {
            // show docker logs in client console
            const stream = await this.container.attach({
                stream: true,
                stdout: true,
                stderr: true,
            })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(this.container as any).modem.demuxStream(
                stream as NodeJS.ReadableStream,
                process.stdout,
                process.stderr,
            )

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

    public async waitForNodeToBeReady(maxAttempts = 20): Promise<void> {
        // anvil-polkadot bundles the substrate node and eth-rpc adapter into
        // a single process that exposes only Ethereum JSON-RPC (eth_chainId).
        // A standalone substrate node (revive-dev-node) exposes Substrate RPC
        // (state_getRuntimeVersion) on its websocket port.
        const method = this.useAnvil ? RPC_ENDPOINT_PATH : "state_getRuntimeVersion"
        const payload = {
            jsonrpc: "2.0",
            method,
            params: [],
            id: 1,
        }

        await waitForServiceToBeReady(this.port, payload, maxAttempts)
    }
}
