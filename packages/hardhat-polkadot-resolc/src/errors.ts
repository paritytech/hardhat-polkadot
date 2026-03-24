import { HardhatPluginError } from "hardhat/plugins"
import { PLUGIN_NAME } from "./constants.js"

export class ResolcPluginError extends HardhatPluginError {
    constructor(message: string, parentError?: Error) {
        super(PLUGIN_NAME, message, parentError)
    }
}
