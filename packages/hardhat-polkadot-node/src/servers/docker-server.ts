import chalk from "chalk"
import { runSimple } from "run-container"
import Docker from "dockerode"

import { NODE_START_PORT, ETH_RPC_ADAPTER_START_PORT } from "../constants"
import { RpcServer } from "../types"
import { waitForNodeToBeReady } from "../utils"

const ADAPTER_CONTAINER_NAME = "eth-rpc-adapter"
const NODE_CONTAINER_NAME = "substrate-node"

export class DockerRpcServer implements RpcServer {
    private adapterContainer: Docker.Container | null = null
    private nodeContainer: Docker.Container | null = null
    private docker: Docker

    constructor() {
        this.docker = new Docker({ socketPath: "/var/run/docker.sock" })
    }

    private async pruneContainerByName(containerName: string) {
        const containers = await this.docker.listContainers({ all: true })
        for (const meta of containers) {
            if (meta.Names.some((name) => name.includes(containerName))) {
                await this.docker.getContainer(meta.Id).remove({ force: true })
            }
        }
    }

    public async listen(
        nodeArgs: string[] = [],
        adapterArgs: string[] = [],
        blockProcess: boolean = true,
    ): Promise<void> {
        const adapterPortArg = adapterArgs.find((arg) => arg.startsWith("--port="))
        const adapterPort = adapterPortArg
            ? parseInt(adapterPortArg.split("=")[1], 10)
            : ETH_RPC_ADAPTER_START_PORT
        const nodePortArg = nodeArgs.find((arg) => arg.startsWith("--rpc-port="))
        const nodePort = nodePortArg ? parseInt(nodePortArg.split("=")[1], 10) : NODE_START_PORT

        // remove running containers
        await this.pruneContainerByName(ADAPTER_CONTAINER_NAME)
        await this.pruneContainerByName(NODE_CONTAINER_NAME)

        // start both containers
        this.nodeContainer = await runSimple({
            name: NODE_CONTAINER_NAME,
            image: "paritypr/substrate:8492-286a9fd2",
            autoRemove: true,
            ports: {
                [`${nodePort}/tcp`]: `${nodePort}`,
            },
            cmd: ["--dev", "--rpc-port", `${nodePort}`, "--unsafe-rpc-external"],
            verbose: true,
        })
        await waitForNodeToBeReady(nodePort)
        this.adapterContainer = await runSimple({
            name: ADAPTER_CONTAINER_NAME,
            image: "paritypr/eth-rpc:master-f331a447",
            autoRemove: true,
            ports: {
                [`${adapterPort}/tcp`]: `${adapterPort}`,
            },
            cmd: [
                "--dev",
                "--rpc-port",
                `${adapterPort}`,
                "--node-rpc-url",
                `ws://host.docker.internal:${nodePort}`,
                "--unsafe-rpc-external",
                "--rpc-cors",
                "all",
            ],
            verbose: true,
        })
        await waitForNodeToBeReady(adapterPort, true)

        if (blockProcess) {
            console.info(chalk.green(`Starting the Eth RPC Adapter at 127.0.0.1:${adapterPort}`))

            // show docker logs in client console
            await Promise.all([
                (async () => {
                    const stream = await this.nodeContainer!.attach({
                        stream: true,
                        stdout: true,
                        stderr: true,
                    })
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ;(this.nodeContainer as any).modem.demuxStream(
                        stream as NodeJS.ReadableStream,
                        process.stdout,
                        process.stderr,
                    )
                })(),
            ])
            await Promise.all([this.adapterContainer.wait(), this.nodeContainer.wait()])
        }
    }

    public async stop(): Promise<void> {
        const dockerProcesses: Promise<unknown>[] = []
        if (this.adapterContainer) {
            dockerProcesses.push(this.adapterContainer.remove({ force: true }))
        }
        if (this.nodeContainer) {
            dockerProcesses.push(this.nodeContainer.remove({ force: true }))
        }
        await Promise.all(dockerProcesses)
    }
}
