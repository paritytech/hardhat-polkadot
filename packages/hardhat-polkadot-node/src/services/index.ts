import chalk from "chalk"
import Docker from "dockerode"
import { ChildProcess } from "child_process"
import { text } from "stream/consumers"

export abstract class Service {
    public process: ChildProcess | null = null
    public container: Docker.Container | null = null

    constructor(
        protected commandArgs: string[],
        protected blockProcess: boolean,
    ) {}

    protected _handleOnExit(name: string) {
        return (code: number | null, signal: NodeJS.Signals | null): void => {
            if (signal) {
                console.info(
                    chalk.yellow(`Received ${signal} signal. The ${name} process has exited.`),
                )
            } else if (code !== 0) {
                console.info(chalk.red(`The ${name} process exited with code: ${code}`))
            }
        }
    }

    protected _handleOnError(name: string, rejectFn: (error: Error) => void) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (error: any): void => {
            console.info(chalk.red(`Error running the ${name}:`, error))
            rejectFn(new Error(`Error running the ${name}: ${error.message}`))
        }
    }

    abstract from_binary(pathToBinary: string): Promise<void>

    abstract from_docker(...args: unknown[]): Promise<void>

    public async getOutput(): Promise<{ stdout: string | null; stderr: string | null }> {
        const stdout = this.process?.stdout ? await text(this.process.stdout) : null
        const stderr = this.process?.stderr ? await text(this.process.stderr) : null

        return { stdout, stderr }
    }
}

export { ChopsticksService } from "./chopsticks"
export { EthRpcService } from "./eth-rpc"
export { SubstrateNodeService } from "./substrate-node"
