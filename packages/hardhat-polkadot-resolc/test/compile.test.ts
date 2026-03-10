import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock child_process.spawn for binary compiler
const mockSpawn = vi.fn()
vi.mock("child_process", async (importOriginal) => {
    const actual = await importOriginal<typeof import("child_process")>()
    return {
        ...actual,
        spawn: (...args: unknown[]) => mockSpawn(...args),
        execSync: actual.execSync,
    }
})

import { compile, BinaryCompiler, NpmCompiler } from "../src/compile/index"
import type { ResolcConfig } from "../src/types"
import type { CompilerInput } from "hardhat/types"

function makeCompilerInput(): CompilerInput {
    return {
        language: "Solidity",
        sources: {
            "Test.sol": {
                content:
                    "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\ncontract Test {}",
            },
        },
        settings: {
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode"],
                },
            },
        },
    }
}

describe("compile", () => {
    it("throws for invalid compiler source", async () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "invalid" as "binary",
            settings: {},
        }
        await expect(compile(config, makeCompilerInput())).rejects.toThrow(
            "Incorrect compiler source",
        )
    })

    it("throws when binary source has null solcPath", async () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { solcPath: null as unknown as string },
        }
        await expect(compile(config, makeCompilerInput())).rejects.toThrow(
            "The path to the resolc binary is not specified",
        )
    })
})

describe("BinaryCompiler", () => {
    it("creates a compiler with config", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { resolcPath: "/path/to/resolc", solcPath: "/path/to/solc" },
        }
        const compiler = new BinaryCompiler(config)
        expect(compiler.config).toBe(config)
    })
})

describe("NpmCompiler", () => {
    it("creates a compiler with config", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "npm",
            settings: {},
        }
        const compiler = new NpmCompiler(config)
        expect(compiler.config).toBe(config)
    })
})

describe("compileWithBinary", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("spawns resolc with --standard-json and pipes input via stdin", async () => {
        const mockOutput = JSON.stringify({
            contracts: {
                "Test.sol": {
                    Test: { abi: [], evm: { bytecode: { object: "deadbeef" } } },
                },
            },
        })

        // Create a mock process with stdin/stdout/stderr
        const handlers: Record<string, Function[]> = {}
        const stdinData: string[] = []
        const mockProcess = {
            stdin: {
                write: vi.fn((data: string) => stdinData.push(data)),
                end: vi.fn(),
            },
            stdout: {
                on: vi.fn((event: string, handler: Function) => {
                    if (event === "data") {
                        // Emit data asynchronously
                        setTimeout(() => handler(Buffer.from(mockOutput)), 10)
                    }
                }),
            },
            stderr: {
                on: vi.fn(),
            },
            on: vi.fn((event: string, handler: Function) => {
                if (!handlers[event]) handlers[event] = []
                handlers[event].push(handler)
                if (event === "close") {
                    setTimeout(() => handler(0), 20)
                }
            }),
        }

        mockSpawn.mockReturnValue(mockProcess)

        const { compileWithBinary } = await import("../src/compile/binary")

        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {
                resolcPath: "/path/to/resolc",
                solcPath: "/path/to/solc",
            },
        }

        const result = await compileWithBinary(makeCompilerInput(), config)

        expect(mockSpawn).toHaveBeenCalledWith("/path/to/resolc", expect.any(Array))
        expect(mockProcess.stdin.write).toHaveBeenCalled()
        expect(mockProcess.stdin.end).toHaveBeenCalled()
        expect(result.contracts["Test.sol"].Test.abi).toEqual([])
    })

    it("rejects when process exits with non-zero code", async () => {
        const handlers: Record<string, Function[]> = {}
        const mockProcess = {
            stdin: { write: vi.fn(), end: vi.fn() },
            stdout: { on: vi.fn() },
            stderr: {
                on: vi.fn((event: string, handler: Function) => {
                    if (event === "data") {
                        setTimeout(() => handler(Buffer.from("compilation error")), 10)
                    }
                }),
            },
            on: vi.fn((event: string, handler: Function) => {
                if (event === "close") {
                    setTimeout(() => handler(1), 20)
                }
            }),
        }

        mockSpawn.mockReturnValue(mockProcess)

        const { compileWithBinary } = await import("../src/compile/binary")

        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {
                resolcPath: "/path/to/resolc",
                solcPath: "/path/to/solc",
            },
        }

        await expect(compileWithBinary(makeCompilerInput(), config)).rejects.toThrow(
            "Process exited with code 1",
        )
    })

    it("includes optimizer settings when optimizer is enabled", async () => {
        const mockOutput = JSON.stringify({ contracts: {} })
        const stdinData: string[] = []

        const mockProcess = {
            stdin: {
                write: vi.fn((data: string) => stdinData.push(data)),
                end: vi.fn(),
            },
            stdout: {
                on: vi.fn((event: string, handler: Function) => {
                    if (event === "data") setTimeout(() => handler(Buffer.from(mockOutput)), 10)
                }),
            },
            stderr: { on: vi.fn() },
            on: vi.fn((event: string, handler: Function) => {
                if (event === "close") setTimeout(() => handler(0), 20)
            }),
        }

        mockSpawn.mockReturnValue(mockProcess)

        const { compileWithBinary } = await import("../src/compile/binary")

        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {
                resolcPath: "/path/to/resolc",
                optimizer: { enabled: true, runs: 200, parameters: "3" },
            },
        }

        await compileWithBinary(makeCompilerInput(), config)

        const input = JSON.parse(stdinData[0])
        expect(input.settings.optimizer.enabled).toBe(true)
        expect(input.settings.optimizer.mode).toBe("3")
        expect(input.settings.optimizer.runs).toBe(200)
    })

    it("includes memory config when provided", async () => {
        const mockOutput = JSON.stringify({ contracts: {} })
        const stdinData: string[] = []

        const mockProcess = {
            stdin: {
                write: vi.fn((data: string) => stdinData.push(data)),
                end: vi.fn(),
            },
            stdout: {
                on: vi.fn((event: string, handler: Function) => {
                    if (event === "data") setTimeout(() => handler(Buffer.from(mockOutput)), 10)
                }),
            },
            stderr: { on: vi.fn() },
            on: vi.fn((event: string, handler: Function) => {
                if (event === "close") setTimeout(() => handler(0), 20)
            }),
        }

        mockSpawn.mockReturnValue(mockProcess)

        const { compileWithBinary } = await import("../src/compile/binary")

        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {
                resolcPath: "/path/to/resolc",
                memoryConfig: { heapSize: 33554432, stackSize: 1048576 },
            },
        }

        await compileWithBinary(makeCompilerInput(), config)

        const input = JSON.parse(stdinData[0])
        expect(input.settings.polkavm.memoryConfig.heapSize).toBe(33554432)
        expect(input.settings.polkavm.memoryConfig.stackSize).toBe(1048576)
    })
})
