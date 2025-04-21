import { exec } from "child_process"
import { CompiledOutput, ContractBatch, ContractSource, ResolcConfig } from "../types"
import { CompilerInput } from "hardhat/types"
import { deepUpdate, extractCommands, mapImports, orderSources } from "../utils"

export async function compileWithBinary(input: CompilerInput, config: ResolcConfig): Promise<CompiledOutput> {
    const { compilerPath, batchSize } = config.settings!;

    const commands = extractCommands(config)

    const processCommand = `${compilerPath} ${commands.join(" ")}`

    const map = mapImports(input)

    const ordered = orderSources(map);

    let parsedOutput: CompiledOutput = {
        contracts: {},
        sources: {},
        errors: [],
        version: '',
        long_version: '',
        revive_version: '',
    };
    if (batchSize) {
        console.log(
            '`batchSize` is an experimental feature and may fail when used with smart contracts that employ relative imports.',
        );
        let selectedContracts: ContractBatch = {};
        for (let i = 0; i < ordered.length; i += batchSize!) {
            selectedContracts = ordered.slice(i, i + batchSize).reduce((acc, key) => {
                acc[key] = input.sources[key]
                return acc
            }, {} as ContractSource)

            const contractBatch: ContractBatch = {
                language: input.language,
                sources: selectedContracts,
                settings: input.settings,
            };

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

                process.stdin!.write(JSON.stringify(contractBatch));
                process.stdin!.end();
            });
            const parsed: CompiledOutput = JSON.parse(output);
            parsedOutput = deepUpdate(parsedOutput, parsed);
        }

        return parsedOutput;
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
