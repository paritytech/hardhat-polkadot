import { spawn } from "child_process"
import type { CompilerInput } from "hardhat/types"
import type { ResolcConfig } from "../types"
import { extractCommands } from "../utils"
import { ResolcPluginError } from "../errors"

export async function compileWithBinary(
    input: CompilerInput,
    config: ResolcConfig,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    const { resolcPath, optimizer } = config.settings!

    const commands = extractCommands(config)

    let optimizerSettings: object | undefined

    if (optimizer?.enabled) {
        optimizerSettings = {
            mode: optimizer?.parameters,
            fallback_to_optimizing_for_size: optimizer?.fallbackOz,
            enabled: true,
            runs: optimizer?.runs,
        }
    } else if (optimizer?.enabled === false) {
        optimizerSettings = {
            enabled: false,
        }
    }

    const inputs = JSON.stringify({
        language: "Solidity",
        sources: input.sources,
        settings: {
            optimizer: optimizerSettings,
            outputSelection: input.settings.outputSelection,
        },
    })

    return new Promise((resolve, reject) => {
        const process = spawn(resolcPath!, commands)

        let output = ""
        let error = ""

        process.stdin.write(inputs)
        process.stdin.end()

        process.stdout.on("data", (data) => {
            output += data.toString()
        })

        process.stderr.on("data", (data) => {
            error += data.toString()
        })

        process.on("close", (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output)
                    resolve(result)
                } catch {
                    reject(new ResolcPluginError(`Failed to parse output`))
                }
            } else {
                reject(new ResolcPluginError(`Process exited with code ${code}: ${error}`))
            }
        })
    })
}
