import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("run-container", () => ({ runSimple: vi.fn(), run: vi.fn() }))

vi.mock("../src/services/service.js", async () => {
    abstract class Service {
        public process: unknown = null
        public container: unknown = null
        constructor(
            protected commandArgs: string[],
            protected blockProcess: boolean,
        ) {}
        protected _handleOnExit(_name: string) { return () => {} }
        protected _handleOnError(_name: string, rejectFn: (error: Error) => void) {
            return (error: Error) => { rejectFn(error) }
        }
        abstract from_binary(pathToBinary: string): Promise<void>
        abstract from_docker(...args: unknown[]): Promise<void>
    }
    return { Service }
})

const { mockListen, mockStop, mockWaitNode } = vi.hoisted(() => ({
    mockListen: vi.fn().mockResolvedValue(undefined),
    mockStop: vi.fn().mockResolvedValue(undefined),
    mockWaitNode: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("../src/utils.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/utils.js")>()
    return {
        ...actual,
        startServer: vi.fn().mockResolvedValue({
            commandArgs: { nodeCommands: [], adapterCommands: [] },
            server: {
                listen: mockListen,
                stop: mockStop,
                services: () => ({
                    substrateNodeService: { waitForNodeToBeReady: mockWaitNode },
                    ethRpcService: null,
                    chopsticksService: null,
                }),
            },
            port: 8545,
        }),
    }
})

vi.mock("axios", () => ({
    default: {
        post: vi.fn().mockResolvedValue({
            data: { jsonrpc: "2.0", id: 1, result: "0x1" },
        }),
    },
}))

import networkHookHandler from "../src/hook-handlers/network.js"
import { startServer } from "../src/utils.js"
import axios from "axios"

describe("network hook handler", () => {
    // Each test gets a fresh handler to avoid shared module-level state
    // leaking between tests (the maps are per-module, but each handler
    // invocation works against them)
    beforeEach(() => {
        vi.clearAllMocks()
    })

    function makeContext(userNetworkConfig: Record<string, unknown> = {}) {
        return {
            config: { networks: {} },
            userConfig: { networks: { hardhat: userNetworkConfig } },
        }
    }

    function makeConnection(overrides: Record<string, unknown> = {}) {
        return {
            id: Math.floor(Math.random() * 100000),
            networkName: "hardhat",
            networkConfig: { polkadot: true, ...overrides },
        }
    }

    describe("newConnection", () => {
        it("starts server for polkadot network and sets localPolkadotUrl", async () => {
            const handler = await networkHookHandler()
            const ctx = makeContext({ polkadot: true, nodeConfig: { useAnvil: true } })
            const conn = makeConnection()
            const next = vi.fn().mockResolvedValue(conn)

            const result = await handler.newConnection!(ctx as any, next)

            expect(startServer).toHaveBeenCalled()
            expect(mockListen).toHaveBeenCalled()
            expect(mockWaitNode).toHaveBeenCalled()
            expect((result as any).localPolkadotUrl).toBe("http://127.0.0.1:8545")
        })

        it("skips non-polkadot networks", async () => {
            const handler = await networkHookHandler()
            const ctx = makeContext({})
            const conn = { id: 2, networkName: "hardhat", networkConfig: {} }
            const next = vi.fn().mockResolvedValue(conn)

            const result = await handler.newConnection!(ctx as any, next)

            expect(startServer).not.toHaveBeenCalled()
            expect(result).toBe(conn)
        })

        it("skips EVM-target polkadot networks", async () => {
            const handler = await networkHookHandler()
            const ctx = makeContext({ polkadot: { target: "evm" } })
            const conn = makeConnection({ polkadot: { target: "evm" } })
            const next = vi.fn().mockResolvedValue(conn)

            await handler.newConnection!(ctx as any, next)

            expect(startServer).not.toHaveBeenCalled()
        })
    })

    describe("onRequest", () => {
        it("proxies requests to the local polkadot server", async () => {
            const handler = await networkHookHandler()
            const ctx = makeContext({ polkadot: true, nodeConfig: { useAnvil: true } })
            const conn = makeConnection()
            const connNext = vi.fn().mockResolvedValue(conn)

            // First establish the connection so the server is started
            await handler.newConnection!(ctx as any, connNext)

            // Now test onRequest
            const request = { jsonrpc: "2.0" as const, id: 1, method: "eth_chainId" }
            const requestNext = vi.fn()

            const result = await handler.onRequest!(ctx as any, conn as any, request, requestNext)

            expect(axios.post).toHaveBeenCalledWith("http://127.0.0.1:8545", request)
            expect(requestNext).not.toHaveBeenCalled()
            expect(result).toEqual({ jsonrpc: "2.0", id: 1, result: "0x1" })
        })

        it("passes through for non-polkadot networks", async () => {
            const handler = await networkHookHandler()
            const ctx = makeContext({})
            const conn = { id: 500, networkName: "mainnet", networkConfig: {} }
            const request = { jsonrpc: "2.0" as const, id: 1, method: "eth_chainId" }
            const mockResponse = { jsonrpc: "2.0", id: 1, result: "0x1" }
            const requestNext = vi.fn().mockResolvedValue(mockResponse)

            const result = await handler.onRequest!(ctx as any, conn as any, request, requestNext)

            expect(requestNext).toHaveBeenCalled()
            expect(axios.post).not.toHaveBeenCalled()
            expect(result).toEqual(mockResponse)
        })
    })

    describe("closeConnection", () => {
        it("stops server when last connection closes", async () => {
            // Use a unique network name to avoid interference from other tests
            const networkName = `polkadot-close-${Date.now()}`
            const handler = await networkHookHandler()
            const ctx = {
                config: { networks: {} },
                userConfig: { networks: { [networkName]: { polkadot: true, nodeConfig: { useAnvil: true } } } },
            }
            const conn = {
                id: Math.floor(Math.random() * 100000),
                networkName,
                networkConfig: { polkadot: true },
            }
            const connNext = vi.fn().mockResolvedValue(conn)

            // Open connection (starts server)
            await handler.newConnection!(ctx as any, connNext)

            // Close connection (should stop server since refCount drops to 0)
            const closeNext = vi.fn().mockResolvedValue(undefined)
            await handler.closeConnection!({} as any, conn as any, closeNext)

            expect(mockStop).toHaveBeenCalled()
            expect(closeNext).toHaveBeenCalled()
        })

        it("calls next for connections without tracked servers", async () => {
            const handler = await networkHookHandler()
            const next = vi.fn().mockResolvedValue(undefined)
            const conn = { id: 999, networkName: "unknown", networkConfig: {} }

            await handler.closeConnection!({} as any, conn as any, next)

            expect(next).toHaveBeenCalled()
        })
    })
})
