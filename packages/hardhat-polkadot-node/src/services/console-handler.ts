import { EventEmitter } from "events"
import chalk from "chalk"

// Type definitions for WebSocket messages
interface WsMessage {
    method: string
    params?: {
        changes?: StorageChange[]
    }
}

interface StorageChange {
    key?: string
    data?: string
}

/**
 * Console output handler for Substrate console.log precompile
 * Captures and formats console.log events from the Substrate node
 */
export class ConsoleLogHandler extends EventEmitter {
    private enabled: boolean = true
    private logPrefix = chalk.gray("[console.log]")

    constructor() {
        super()
    }

    /**
     * Enable or disable console output
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled
    }

    /**
     * Process raw output from Substrate node to detect console.log events
     */
    public processOutput(data: string): void {
        if (!this.enabled) return

        // Look for console.log patterns in the output
        const lines = data.split("\n")
        for (const line of lines) {
            if (this.isConsoleLog(line)) {
                this.handleConsoleLog(line)
            }
        }
    }

    /**
     * Check if a line contains a console.log output
     */
    private isConsoleLog(line: string): boolean {
        // Single unified pattern to match all console.log formats
        const CONSOLE_PATTERN = /(?:console\.log:|runtime::console|0x000000000000000000636f6e736f6c652e6c6f67)[:\s]*/i
        return CONSOLE_PATTERN.test(line)
    }

    /**
     * Extract and format console.log message
     */
    private handleConsoleLog(line: string): void {
        // Single unified pattern to extract the message content
        const CONSOLE_EXTRACT_PATTERN = /(?:console\.log:|runtime::console)[:\s]*(.*)/i
        const CONSOLE_ADDRESS_PATTERN = /0x000000000000000000636f6e736f6c652e6c6f67[:\s]*(.*)/i
        
        let message = line
        
        // Try the unified extraction pattern
        let match = line.match(CONSOLE_EXTRACT_PATTERN)
        if (match) {
            message = match[1].trim()
        } else {
            // Try the address pattern
            match = line.match(CONSOLE_ADDRESS_PATTERN)
            if (match) {
                message = match[1].trim()
            }
        }

        // Format and output the message
        this.outputLog(message)
        
        // Emit event for programmatic access
        this.emit("log", message)
    }

    /**
     * Output formatted console.log message
     */
    private outputLog(message: string): void {
        // Parse and format different types of logs
        if (message.startsWith("0x")) {
            // Address or bytes output
            console.log(`${this.logPrefix} ${chalk.cyan(message)}`)
        } else if (message.match(/^\d+$/)) {
            // Number output
            console.log(`${this.logPrefix} ${chalk.yellow(message)}`)
        } else if (message === "true" || message === "false") {
            // Boolean output
            console.log(`${this.logPrefix} ${chalk.magenta(message)}`)
        } else {
            // String output
            console.log(`${this.logPrefix} ${message}`)
        }
    }

    /**
     * Process WebSocket messages from Substrate node
     */
    public processWsMessage(message: WsMessage): void {
        if (!this.enabled) return

        // Check for console.log events in substrate events
        if (message.method === "state_storage" && message.params?.changes) {
            for (const change of message.params.changes) {
                // Look for console precompile events
                if (this.isConsolePrecompileEvent(change)) {
                    this.handlePrecompileEvent(change)
                }
            }
        }
    }

    /**
     * Check if a storage change is from console precompile
     */
    private isConsolePrecompileEvent(change: StorageChange): boolean {
        // Check if the storage key relates to EVM events
        const key = change.key || ""
        return key.includes("EVM") && key.includes("Event")
    }

    /**
     * Handle console precompile event from storage
     */
    private handlePrecompileEvent(change: StorageChange): void {
        try {
            // Decode the event data
            const data = change.data
            if (data) {
                // Parse event data to extract console.log message
                // This would need proper codec decoding in production
                const decoded = this.decodeEventData(data)
                if (decoded) {
                    this.outputLog(decoded)
                    this.emit("log", decoded)
                }
            }
        } catch {
            // Silently ignore decoding errors
        }
    }

    /**
     * Decode event data from hex
     * This is a simplified version - production would use proper scale codec
     */
    private decodeEventData(hexData: string): string | null {
        try {
            // Remove 0x prefix if present
            const hex = hexData.startsWith("0x") ? hexData.slice(2) : hexData
            
            // Try to decode as UTF-8
            const bytes = Buffer.from(hex, "hex")
            const text = bytes.toString("utf8")
            
            // Check if it looks like a console.log message
            if (text.includes("console.log") || this.isValidLogMessage(text)) {
                return this.extractLogMessage(text)
            }
            
            return null
        } catch {
            return null
        }
    }

    /**
     * Check if decoded text is a valid log message
     */
    private isValidLogMessage(text: string): boolean {
        // Basic validation - check if it's printable text
        return /^[\x20-\x7E\n\r\t]+$/.test(text)
    }

    /**
     * Extract the actual log message from decoded data
     */
    private extractLogMessage(text: string): string {
        // Remove any protocol wrapping and extract the message
        const patterns = [
            /console\.log:\s*(.+)/,
            /log:\s*(.+)/,
            /message:\s*(.+)/,
        ]

        for (const pattern of patterns) {
            const match = text.match(pattern)
            if (match) {
                return match[1].trim()
            }
        }

        // Return cleaned text if no pattern matches
        return text.trim()
    }
}

// Export singleton instance
export const consoleLogHandler = new ConsoleLogHandler()