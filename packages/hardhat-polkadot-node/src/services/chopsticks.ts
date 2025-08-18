import { spawn, StdioOptions } from "child_process"
import Docker from "dockerode"
import chalk from "chalk"

import { NODE_START_PORT } from "../constants"
import { Service } from "./index"

export class ChopsticksService extends Service {
    public port: number

    constructor(commandArgs: string[] = [], blockProcess: boolean = true) {
        super(commandArgs, blockProcess)

        const portArg = commandArgs.find((arg) => arg.startsWith("--port="))
        this.port = portArg ? parseInt(portArg.split("=")[1], 10) : NODE_START_PORT
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
                // FIXME: this leads to silent failures
                stdioConfig = ["ignore", "ignore", "ignore"]
            }

            this.process = spawn(this.commandArgs[0], this.commandArgs.slice(1), {
                stdio: stdioConfig,
            })

            this.process.on("error", this._handleOnError("server", reject))
            this.process.on("exit", this._handleOnExit("server"))

            if (!this.blockProcess) {
                resolve()
            }
        })
    }

    public async from_docker(_: Docker): Promise<void> {
        // not used
    }

    public async stop(): Promise<void> {
        if (this.process && !this.process.killed) {
            this.process.kill()
        }
    }
}
