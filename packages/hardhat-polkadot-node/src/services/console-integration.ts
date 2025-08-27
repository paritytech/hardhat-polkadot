import { SubstrateNodeService } from "./substrate-node"
import { EthRpcService } from "./eth-rpc"
import { consoleLogHandler } from "./console-handler"

/**
 * Integrate console.log handling into Substrate and Eth RPC services
 */
export function integrateConsoleLogging(
    substrateService: SubstrateNodeService | undefined,
    ethRpcService: EthRpcService | undefined
): void {
    // Attach console handler to Substrate node output
    if (substrateService && substrateService.process) {
        if (substrateService.process.stdout) {
            substrateService.process.stdout.on("data", (data: Buffer) => {
                const output = data.toString()
                consoleLogHandler.processOutput(output)
            })
        }

        if (substrateService.process.stderr) {
            substrateService.process.stderr.on("data", (data: Buffer) => {
                const output = data.toString()
                consoleLogHandler.processOutput(output)
            })
        }
    }

    // Attach console handler to Eth RPC adapter output
    if (ethRpcService && ethRpcService.process) {
        if (ethRpcService.process.stdout) {
            ethRpcService.process.stdout.on("data", (data: Buffer) => {
                const output = data.toString()
                consoleLogHandler.processOutput(output)
            })
        }

        if (ethRpcService.process.stderr) {
            ethRpcService.process.stderr.on("data", (data: Buffer) => {
                const output = data.toString()
                consoleLogHandler.processOutput(output)
            })
        }
    }
}

/**
 * Enable or disable console.log output
 */
export function setConsoleLogEnabled(enabled: boolean): void {
    consoleLogHandler.setEnabled(enabled)
}

/**
 * Get the console log handler instance for custom event handling
 */
export function getConsoleLogHandler() {
    return consoleLogHandler
}