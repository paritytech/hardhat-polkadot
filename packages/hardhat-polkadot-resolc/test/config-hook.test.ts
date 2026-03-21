import { describe, it, expect } from "vitest"

import configHookHandler, { resolveResolcConfig } from "../src/hook-handlers/config.js"

describe("resolveResolcConfig", () => {
    it("returns binary defaults when no user config", () => {
        const config = resolveResolcConfig({})
        expect(config.compilerSource).toBe("binary")
        expect(config.settings?.optimizer?.enabled).toBe(true)
        expect(config.settings?.optimizer?.runs).toBe(200)
    })

    it("returns npm defaults when compilerSource is npm", () => {
        const config = resolveResolcConfig({ resolc: { compilerSource: "npm" } })
        expect(config.compilerSource).toBe("npm")
    })

    it("merges user optimizer settings over defaults", () => {
        const config = resolveResolcConfig({
            resolc: { settings: { optimizer: { runs: 500 } } },
        })
        expect(config.settings?.optimizer?.runs).toBe(500)
        expect(config.settings?.optimizer?.enabled).toBe(true)
    })

    it("preserves user version", () => {
        const config = resolveResolcConfig({ resolc: { version: "0.6.0" } })
        expect(config.version).toBe("0.6.0")
    })
})

describe("config hook handler", () => {
    describe("validateUserConfig", () => {
        async function validate(config: Record<string, unknown>) {
            const handler = await configHookHandler()
            return handler.validateUserConfig!(config)
        }

        it("returns no errors when no resolc config", async () => {
            const errors = await validate({})
            expect(errors).toEqual([])
        })

        it("returns error for invalid compilerSource", async () => {
            const errors = await validate({ resolc: { compilerSource: "invalid" } })
            expect(errors).toHaveLength(1)
            expect(errors[0].path).toEqual(["resolc", "compilerSource"])
        })

        it("accepts valid compilerSource values", async () => {
            expect(await validate({ resolc: { compilerSource: "binary" } })).toEqual([])
            expect(await validate({ resolc: { compilerSource: "npm" } })).toEqual([])
        })

        it("returns error for non-string version", async () => {
            const errors = await validate({ resolc: { version: 123 } })
            expect(errors).toHaveLength(1)
            expect(errors[0].path).toEqual(["resolc", "version"])
        })
    })

    describe("extendUserConfig", () => {
        it("extends config when polkadot network present", async () => {
            const handler = await configHookHandler()
            const config = { networks: { hardhat: { polkadot: true } } }
            const next = (c: any) => Promise.resolve(c)

            const result = await handler.extendUserConfig!(config, next)

            expect(result.resolc).toBeDefined()
            expect(result.resolc.compilerSource).toBe("binary")
        })

        it("does not extend when no polkadot network", async () => {
            const handler = await configHookHandler()
            const config = { networks: { hardhat: {} } }
            const next = (c: any) => Promise.resolve(c)

            const result = await handler.extendUserConfig!(config, next)

            expect(result.resolc).toBeUndefined()
        })

        it("does not extend when targeting EVM", async () => {
            const handler = await configHookHandler()
            const config = { networks: { hardhat: { polkadot: { target: "evm" } } } }
            const next = (c: any) => Promise.resolve(c)

            const result = await handler.extendUserConfig!(config, next)

            expect(result.resolc).toBeUndefined()
        })
    })
})
