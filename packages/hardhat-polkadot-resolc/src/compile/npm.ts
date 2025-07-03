import path from "path"
import { exec as execCb, execSync } from "child_process"
import { promisify } from "util"
import semver from "semver"
import { compile, resolveInputs, type SolcOutput } from "@parity/resolc"
import type { CompilerInput } from "hardhat/types"
import type { ResolcConfig } from "src/types"
import { ResolcPluginError } from "../errors"

const _exec = promisify(execCb)

export async function compileWithNpm(
    input: CompilerInput,
    config: ResolcConfig,
): Promise<SolcOutput> {
    const sources = resolveInputs(input.sources)

    if (config.settings?.optimizer?.enabled) {
        const optimizer = {
            mode: config.settings?.optimizer?.parameters,
            fallback_to_optimizing_for_size: config.settings?.optimizer?.fallbackOz,
            enabled: true,
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

export function updateSolc(version: string) {
    let currentVersion: string | null = null

    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pkg = require(path.resolve("node_modules/solc/package.json"))
        currentVersion = pkg.version
    } catch {
        // solc not installed or unreadable
    }

    if (!currentVersion || !semver.satisfies(currentVersion, version)) {
        try {
            execSync(`npm install --save-dev --save-exact solc@${version} --quiet`, {
                stdio: "inherit",
            })
        } catch (error) {
            throw new ResolcPluginError(
                `Compilation failed during solc@${version} installation: ${(error as Error).message}`,
            )
        }
    }
}
