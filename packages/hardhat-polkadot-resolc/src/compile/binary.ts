import { exec } from "child_process"
import type { CompilerInput } from "hardhat/types"
import type { ResolcConfig } from "../types"
import { extractCommands } from "../utils"
import { ResolcPluginError } from "../errors"
import { resolveInputs, SolcOutput } from "@parity/resolc"
import chalk from "chalk"

export async function compileWithBinary(
    input: CompilerInput,
    config: ResolcConfig,
): Promise<SolcOutput> {
    const { compilerPath, optimizer } = config.settings!

    if (config.settings?.batchSize) {
        console.log(chalk.yellow('This property is deprecated and will be removed. Treating as no effect.'))
    }

    const commands = extractCommands(config)

    let optimizerSettings: object | undefined;

    if (!!optimizer?.enabled) {
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
        language: 'Solidity',
        sources: resolveInputs(input.sources),
        settings: {
            optimizer: optimizerSettings,
            outputSelection: {
                '*': {
                    '*': ['abi'],
                },
            },
        },
    })

    return new Promise((resolve, reject) => {
        const process = spawn(compilerPath!, commands)

        let output = ''
        let error = ''

        process.stdin.write(inputs)
        process.stdin.end()

        process.stdout.on('data', (data) => {
            output += data.toString()
        })

        return parsedOutput
    } else {
        const output: string = await new Promise((resolve, reject) => {
            const process = exec(
                processCommand,
                {
                    maxBuffer: 1024 * 1024 * 500,
                },
                (err, stdout, _stderr) => {
                    if (err !== null) {
                        return reject(err)
                    }
                    resolve(stdout)
                },
            )

            process.stdin!.write(JSON.stringify(input))
            process.stdin!.end()
        })

        return JSON.parse(output)
    }
}
