import type { CompilerInput } from "hardhat/types"
import type { ICompiler, ResolcConfig } from "../types"
import { ResolcPluginError } from "../errors"
import { compileWithBinary } from "./binary"
import { compileWithNpm } from "./npm"

export async function compile(resolcConfig: ResolcConfig, input: CompilerInput) {
    let compiler: ICompiler

    if (resolcConfig.compilerSource === "binary") {
        if (resolcConfig.settings?.solcPath === null) {
            throw new ResolcPluginError("The path to the resolc binary is not specified.")
        }
        compiler = new BinaryCompiler(resolcConfig)
    } else if (resolcConfig.compilerSource === "npm") {
        compiler = new NpmCompiler(resolcConfig)
    } else {
        throw new ResolcPluginError(`Incorrect compiler source: ${resolcConfig.compilerSource}`)
    }

    return await compiler.compile(input, resolcConfig)
}

export class BinaryCompiler implements ICompiler {
    constructor(public config: ResolcConfig) {}

    public async compile(input: CompilerInput) {
        return await compileWithBinary(input, this.config)
    }
}

export class NpmCompiler implements ICompiler {
    constructor(public config: ResolcConfig) {}

    public async compile(input: CompilerInput) {
        return await compileWithNpm(input, this.config)
    }
}
