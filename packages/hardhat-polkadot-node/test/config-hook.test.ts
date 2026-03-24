import { describe, it, expect } from "vitest"

import configHookHandler from "../src/hook-handlers/config.js"

describe("config hook handler", () => {
    async function validate(config: Record<string, unknown>) {
        const handler = await configHookHandler()
        return handler.validateUserConfig!(config)
    }

    async function extend(config: Record<string, unknown>) {
        const handler = await configHookHandler()
        const next = (c: any) => Promise.resolve(c)
        return handler.extendUserConfig!(config, next)
    }

    describe("validateUserConfig", () => {
        it("returns no errors for valid config", async () => {
            const errors = await validate({
                networks: { hardhat: { polkadot: true } },
            })
            expect(errors).toEqual([])
        })

        it("returns no errors when no polkadot networks", async () => {
            const errors = await validate({
                networks: { hardhat: {} },
            })
            expect(errors).toEqual([])
        })

        it("returns no errors for polkadot object config", async () => {
            const errors = await validate({
                networks: { hardhat: { polkadot: { target: "evm" } } },
            })
            expect(errors).toEqual([])
        })

        it("returns error for invalid polkadot type", async () => {
            const errors = await validate({
                networks: { hardhat: { polkadot: "invalid" } },
            })
            expect(errors).toHaveLength(1)
            expect(errors[0].path).toEqual(["networks", "hardhat", "polkadot"])
        })

        it("returns error for non-numeric rpcPort", async () => {
            const errors = await validate({
                networks: { hardhat: { polkadot: true, nodeConfig: { rpcPort: "abc" } } },
            })
            expect(errors).toHaveLength(1)
            expect(errors[0].path).toEqual(["networks", "hardhat", "nodeConfig", "rpcPort"])
        })

        it("returns error for non-numeric adapterPort", async () => {
            const errors = await validate({
                networks: { hardhat: { polkadot: true, adapterConfig: { adapterPort: "abc" } } },
            })
            expect(errors).toHaveLength(1)
            expect(errors[0].path).toEqual([
                "networks",
                "hardhat",
                "adapterConfig",
                "adapterPort",
            ])
        })

        it("returns error when adapter and node share the same port", async () => {
            const errors = await validate({
                networks: {
                    hardhat: {
                        polkadot: true,
                        nodeConfig: { rpcPort: 9944 },
                        adapterConfig: { adapterPort: 9944 },
                    },
                },
            })
            expect(errors).toHaveLength(1)
            expect(errors[0].message).toContain("cannot share the same port")
        })

        it("handles empty networks", async () => {
            const errors = await validate({ networks: {} })
            expect(errors).toEqual([])
        })

        it("handles missing networks", async () => {
            const errors = await validate({})
            expect(errors).toEqual([])
        })
    })

    describe("extendUserConfig", () => {
        it("adds edr-simulated type to polkadot network without type", async () => {
            const result = await extend({
                networks: { hardhat: { polkadot: true } },
            })
            expect(result.networks.hardhat.type).toBe("edr-simulated")
        })

        it("adds http type to polkadot network with url", async () => {
            const result = await extend({
                networks: { testnet: { polkadot: true, url: "https://example.com" } },
            })
            expect(result.networks.testnet.type).toBe("http")
        })

        it("does not overwrite existing type", async () => {
            const result = await extend({
                networks: { hardhat: { polkadot: true, type: "http" } },
            })
            expect(result.networks.hardhat.type).toBe("http")
        })

        it("does not add type to non-polkadot networks", async () => {
            const result = await extend({
                networks: { mainnet: { url: "https://example.com" } },
            })
            expect(result.networks.mainnet.type).toBeUndefined()
        })
    })
})
