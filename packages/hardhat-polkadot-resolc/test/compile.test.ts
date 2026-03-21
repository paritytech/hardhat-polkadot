import { describe, it, expect, vi } from "vitest"

vi.mock("../src/compile/binary.js", () => ({
    compileWithBinary: vi.fn().mockResolvedValue({ contracts: {} }),
}))

vi.mock("../src/compile/npm.js", () => ({
    compileWithNpm: vi.fn().mockResolvedValue({ contracts: {} }),
    updateSolc: vi.fn(),
}))

import { compile, BinaryCompiler, NpmCompiler } from "../src/compile/index.js"
import { compileWithBinary } from "../src/compile/binary.js"
import { compileWithNpm } from "../src/compile/npm.js"

const dummyInput = { language: "Solidity" as const, sources: {}, settings: {} }

describe("compile", () => {
    it("uses BinaryCompiler for binary source", async () => {
        const config = { version: "0.5.0", compilerSource: "binary" as const, settings: { solcPath: "/solc" } }
        await compile(config, dummyInput)
        expect(compileWithBinary).toHaveBeenCalled()
    })

    it("uses NpmCompiler for npm source", async () => {
        const config = { version: "0.5.0", compilerSource: "npm" as const, settings: {} }
        await compile(config, dummyInput)
        expect(compileWithNpm).toHaveBeenCalled()
    })

    it("throws for invalid compiler source", async () => {
        const config = { version: "0.5.0", compilerSource: "invalid" as any, settings: {} }
        await expect(compile(config, dummyInput)).rejects.toThrow("Incorrect compiler source")
    })

    it("throws when binary source has null solcPath", async () => {
        const config = { version: "0.5.0", compilerSource: "binary" as const, settings: { solcPath: null } }
        await expect(compile(config as any, dummyInput)).rejects.toThrow("path to the resolc binary")
    })
})

describe("BinaryCompiler", () => {
    it("delegates to compileWithBinary", async () => {
        const config = { version: "0.5.0", compilerSource: "binary" as const, settings: {} }
        const compiler = new BinaryCompiler(config)
        await compiler.compile(dummyInput)
        expect(compileWithBinary).toHaveBeenCalledWith(dummyInput, config)
    })
})

describe("NpmCompiler", () => {
    it("delegates to compileWithNpm", async () => {
        const config = { version: "0.5.0", compilerSource: "npm" as const, settings: {} }
        const compiler = new NpmCompiler(config)
        await compiler.compile(dummyInput)
        expect(compileWithNpm).toHaveBeenCalledWith(dummyInput, config)
    })
})
