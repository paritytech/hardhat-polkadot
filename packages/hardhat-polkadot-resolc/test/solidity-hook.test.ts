import { describe, it, expect, vi } from "vitest"

vi.mock("../src/compile/index.js", () => ({
    compile: vi.fn().mockResolvedValue({
        contracts: {
            "Foo.sol": {
                Foo: {
                    abi: [],
                    evm: { bytecode: { object: "deadbeef" } },
                },
            },
        },
    }),
}))

vi.mock("../src/downloader.js", () => ({
    ResolcCompilerDownloader: {
        getCompilerPlatform: vi.fn().mockReturnValue("linux-amd64"),
        getConcurrencySafeDownloader: vi.fn().mockReturnValue({
            downloadCompiler: vi.fn().mockImplementation(
                async (_v: string, startCb: Function, endCb: Function) => {
                    await startCb(true)
                    await endCb(true)
                },
            ),
            getCompiler: vi.fn().mockResolvedValue({
                resolcPath: "/mock/resolc",
                version: "0.5.0",
                longVersion: "0.5.0",
                isJs: false,
            }),
        }),
    },
}))

vi.mock("@nomicfoundation/hardhat-utils/global-dir", () => ({
    getCacheDir: vi.fn().mockResolvedValue("/tmp/cache"),
}))

import solidityHookHandler from "../src/hook-handlers/solidity.js"
import { compile } from "../src/compile/index.js"

describe("solidity hook handler", () => {
    describe("invokeSolc", () => {
        it("delegates to next when no resolc config", async () => {
            const handler = await solidityHookHandler()
            const context = { config: {} }
            const next = vi.fn().mockResolvedValue({ contracts: {} })

            await handler.invokeSolc!(
                context as any,
                {} as any,
                { language: "Solidity", sources: {}, settings: {} },
                { version: "0.8.28", path: "/solc" },
                next,
            )

            expect(next).toHaveBeenCalled()
            expect(compile).not.toHaveBeenCalled()
        })

        it("compiles with resolc when config present", async () => {
            const handler = await solidityHookHandler()
            const context = {
                config: {
                    resolc: { version: "0.5.0", compilerSource: "binary", settings: {} },
                },
            }
            const next = vi.fn()
            const solcInput = {
                language: "Solidity",
                sources: { "Foo.sol": { content: "contract Foo {}" } },
                settings: {},
            }

            const result = await handler.invokeSolc!(
                context as any,
                {} as any,
                solcInput,
                { version: "0.8.28", path: "/solc" },
                next,
            )

            expect(compile).toHaveBeenCalled()
            expect(next).not.toHaveBeenCalled()
            // Check output normalization
            expect(result.contracts["Foo.sol"].Foo.evm.bytecode.object).toBe("deadbeef")
            expect(result.contracts["Foo.sol"].Foo.evm.bytecode.linkReferences).toEqual({})
        })

        it("throws for solidity versions below 0.8.0", async () => {
            const handler = await solidityHookHandler()
            const context = {
                config: {
                    resolc: { version: "0.5.0", compilerSource: "binary", settings: {} },
                },
            }

            await expect(
                handler.invokeSolc!(
                    context as any,
                    {} as any,
                    { language: "Solidity", sources: {}, settings: {} },
                    { version: "0.7.6", path: "/solc" },
                    vi.fn(),
                ),
            ).rejects.toThrow("Solidity versions below 0.8.0 are not supported")
        })
    })

    describe("preprocessSolcInputBeforeBuilding", () => {
        it("sets output selection when resolc config present", async () => {
            const handler = await solidityHookHandler()
            const context = {
                config: {
                    resolc: { version: "0.5.0", compilerSource: "binary", settings: {} },
                },
            }
            const solcInput = { language: "Solidity", sources: {}, settings: {} as any }
            const next = vi.fn().mockImplementation((_ctx, input) => Promise.resolve(input))

            await handler.preprocessSolcInputBeforeBuilding!(context as any, solcInput, next)

            expect(solcInput.settings.outputSelection).toBeDefined()
            expect(solcInput.settings.outputSelection["*"]["*"]).toContain("abi")
        })

        it("delegates to next when no resolc config", async () => {
            const handler = await solidityHookHandler()
            const context = { config: {} }
            const solcInput = { language: "Solidity", sources: {}, settings: {} }
            const next = vi.fn().mockImplementation((_ctx, input) => Promise.resolve(input))

            await handler.preprocessSolcInputBeforeBuilding!(context as any, solcInput, next)

            expect(next).toHaveBeenCalled()
        })
    })
})
