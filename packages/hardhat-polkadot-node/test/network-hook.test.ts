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

vi.mock("../src/utils.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/utils.js")>()
    return {
        ...actual,
        startServer: vi.fn().mockResolvedValue({
            commandArgs: { nodeCommands: [], adapterCommands: [] },
            server: {
                listen: vi.fn().mockResolvedValue(undefined),
                stop: vi.fn().mockResolvedValue(undefined),
                services: () => ({
                    substrateNodeService: { waitForNodeToBeReady: vi.fn().mockResolvedValue(undefined) },
                    ethRpcService: null,
                    chopsticksService: null,
                }),
            },
            port: 8545,
        }),
    }
})

import networkHookHandler from "../src/hook-handlers/network.js"
import { startServer } from "../src/utils.js"

describe("network hook handler", () => {
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
            id: 1,
            networkName: "hardhat",
            networkConfig: { polkadot: true, ...overrides },
        }
    }

    describe("newConnection", () => {
        it("starts server for polkadot network", async () => {
            const handler = await networkHookHandler()
            const ctx = makeContext({ polkadot: true, nodeConfig: { useAnvil: true } })
            const conn = makeConnection()
            const next = vi.fn().mockResolvedValue(conn)

            const result = await handler.newConnection!(ctx as any, next)

            expect(startServer).toHaveBeenCalled()
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

    describe("closeConnection", () => {
        it("calls next for connections without tracked servers", async () => {
            const handler = await networkHookHandler()
            const next = vi.fn().mockResolvedValue(undefined)
            const conn = { id: 999, networkName: "hardhat", networkConfig: {} }

            await handler.closeConnection!({} as any, conn as any, next)

            expect(next).toHaveBeenCalled()
        })
    })
})
