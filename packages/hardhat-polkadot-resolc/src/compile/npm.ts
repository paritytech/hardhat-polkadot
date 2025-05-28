import { exec as execCb } from "child_process"
import { promisify } from "util"
import { compile, resolveInputs, type SolcOutput } from "@parity/resolc"
import type { CompilerInput } from "hardhat/types"
import type { ResolcConfig } from "src/types"

const _exec = promisify(execCb)

export async function compileWithNpm(
    input: CompilerInput,
    config: ResolcConfig,
): Promise<SolcOutput> {
    const sources = resolveInputs(input.sources)

    if (config.settings?.optimizer?.enabled) {
        const optimizer = {
            enabled: true,
            mode: config.settings?.optimizer?.parameters,
            fallback_to_optimizing_for_size: config.settings?.optimizer?.fallbackOz,
            runs: config.settings?.optimizer?.runs,
        }

        const out = compile(sources, { optimizer })

        return out
    } else if (config.settings?.optimizer?.enabled === false) {
        const optimizer = {
            enabled: false,
        }

        const out = compile(sources, { optimizer })

        return out
    } else {
        const out = compile(sources)

        return out
    }
}
