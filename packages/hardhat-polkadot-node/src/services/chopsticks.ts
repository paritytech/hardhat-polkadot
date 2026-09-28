import { spawn, spawnSync, StdioOptions } from "child_process"
import Docker from "dockerode"
import chalk from "chalk"

import { NODE_START_PORT } from "../constants"
import { Service } from "./index"

const IS_WINDOWS = process.platform === "win32"
const PARENT_TERMINATION_SIGNALS: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"]

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

            // don't pass stdin, a detached group reading the tty gets SIGTTIN (npx install prompt)
            let stdioConfig: StdioOptions = ["ignore", "inherit", "inherit"]
            if (!this.blockProcess) {
                stdioConfig = ["ignore", "pipe", "pipe"]
            }

            // we only get the npx wrapper here, chopsticks runs as a grandchild. Give it its own
            // process group so we can kill everything together, otherwise chopsticks stays alive
            // and keeps the port busy (#278)
            this.process = spawn(this.commandArgs[0], this.commandArgs.slice(1), {
                stdio: stdioConfig,
                detached: !IS_WINDOWS,
            })

            this._registerParentHandlers()

            this.process.on("error", this._handleOnError("chopsticks server", reject))
            this.process.on("exit", this._handleOnExit("chopsticks server"))

            if (!this.blockProcess) {
                resolve()
            }
        })
    }

    public async from_docker(_: Docker): Promise<void> {
        // not used
    }

    public async stop(): Promise<void> {
        this._removeParentHandlers()
        this._killProcessTree()
    }

    private _killProcessTree(signal: NodeJS.Signals = "SIGTERM"): void {
        const child = this.process
        if (!child) {
            return
        }

        if (child.pid === undefined) {
            if (!child.killed) child.kill(signal)
            return
        }

        // don't check if the wrapper exited, the group is still there while chopsticks runs
        try {
            if (IS_WINDOWS) {
                spawnSync("taskkill", ["/pid", `${child.pid}`, "/T", "/F"], { stdio: "ignore" })
            } else {
                // negative pid = whole process group
                process.kill(-child.pid, signal)
            }
        } catch {
            // already gone
        }
    }

    // since the child has its own group, Ctrl+C doesn't reach it anymore, so forward it.
    // this also covers signals sent only to the hardhat process (IDE stop, kill, CI cancel)
    private _onParentExit = (): void => {
        this._killProcessTree()
    }

    private _onParentSignal = (signal: NodeJS.Signals): void => {
        this._killProcessTree()

        // if we're the only listener, re-raise so node exits like it normally would
        if (process.listenerCount(signal) === 1) {
            this._removeParentHandlers()
            process.kill(process.pid, signal)
        }
    }

    private _registerParentHandlers(): void {
        this._removeParentHandlers()
        process.on("exit", this._onParentExit)
        PARENT_TERMINATION_SIGNALS.forEach((s) => process.on(s, this._onParentSignal))
    }

    private _removeParentHandlers(): void {
        process.removeListener("exit", this._onParentExit)
        PARENT_TERMINATION_SIGNALS.forEach((s) => process.removeListener(s, this._onParentSignal))
    }
}
