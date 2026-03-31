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

    describe("resolveUserConfig", () => {
        async function resolve(userConfig: Record<string, unknown>) {
            const handler = await configHookHandler()
            // Simulate HH3's next() which returns a base resolved config
            const next = async (uc: any, _resolver: any) => ({
                networks: Object.fromEntries(
                    Object.keys(uc.networks ?? {}).map((name) => [name, {}]),
                ),
            })
            const resolver = (v: unknown) => String(v)
            return handler.resolveUserConfig!(userConfig, resolver, next)
        }

        it("copies polkadot field to resolved config", async () => {
            const result = await resolve({
                networks: { default: { polkadot: true } },
            })
            expect(result.networks.default.polkadot).toBe(true)
        })

        it("copies polkadot object config to resolved config", async () => {
            const result = await resolve({
                networks: { default: { polkadot: { target: "evm" } } },
            })
            expect(result.networks.default.polkadot).toEqual({ target: "evm" })
        })

        it("copies nodeConfig to resolved config", async () => {
            const nodeConfig = { rpcPort: 9944, dev: true, nodeBinaryPath: "/usr/bin/node" }
            const result = await resolve({
                networks: { default: { polkadot: true, nodeConfig } },
            })
            expect(result.networks.default.nodeConfig).toEqual(nodeConfig)
        })

        it("copies adapterConfig to resolved config", async () => {
            const adapterConfig = { adapterPort: 8545, dev: true }
            const result = await resolve({
                networks: { default: { polkadot: true, adapterConfig } },
            })
            expect(result.networks.default.adapterConfig).toEqual(adapterConfig)
        })

        it("copies docker flag to resolved config", async () => {
            const result = await resolve({
                networks: { default: { polkadot: true, docker: true } },
            })
            expect(result.networks.default.docker).toBe(true)
        })

        it("copies forking config to resolved config", async () => {
            const forking = { enabled: true, url: "https://rpc.example.com" }
            const result = await resolve({
                networks: { default: { polkadot: true, forking } },
            })
            expect(result.networks.default.forking).toEqual(forking)
        })

        it("does not copy polkadot fields to non-polkadot networks", async () => {
            const result = await resolve({
                networks: {
                    default: { polkadot: true, docker: true },
                    sepolia: { url: "https://sepolia.example.com" },
                },
            })
            expect(result.networks.default.polkadot).toBe(true)
            expect(result.networks.default.docker).toBe(true)
            expect(result.networks.sepolia.polkadot).toBeUndefined()
            expect(result.networks.sepolia.docker).toBeUndefined()
        })
    })
})
