import { describe, it, expect, vi } from "vitest"
import { ChildProcess } from "child_process"
import { NODE_START_PORT, ETH_RPC_ADAPTER_START_PORT } from "../src/constants"

// Mock run-container (used by docker paths we don't test here)
vi.mock("run-container", () => ({ runSimple: vi.fn(), run: vi.fn() }))

// Mock the barrel (services/index.ts) to break the circular dependency chain.
// We provide a real Service base class so the individual service files can extend it.
vi.mock("../src/services/index", async () => {
    const chalk = await import("chalk")
    const { ChildProcess } = await import("child_process")

    abstract class Service {
        public process: ChildProcess | null = null
        public container: unknown = null

        constructor(
            protected commandArgs: string[],
            protected blockProcess: boolean,
        ) {}

        protected _handleOnExit(name: string) {
            return (_code: number | null, _signal: NodeJS.Signals | null): void => {}
        }

        protected _handleOnError(name: string, rejectFn: (error: Error) => void) {
            return (error: Error): void => {
                rejectFn(new Error(`Error running the ${name}: ${error.message}`))
            }
        }

        abstract from_binary(pathToBinary: string): Promise<void>
        abstract from_docker(...args: unknown[]): Promise<void>
    }

    return { Service }
})

import { SubstrateNodeService } from "../src/services/substrate-node"
import { EthRpcService } from "../src/services/eth-rpc"
import { ChopsticksService } from "../src/services/chopsticks"

describe("SubstrateNodeService", () => {
    describe("constructor", () => {
        it("defaults to 8545 (anvil port) when no port arg", () => {
            const service = new SubstrateNodeService()
            expect(service.port).toBe(8545)
        })

        it("defaults to NODE_START_PORT when useAnvil is false and no port arg", () => {
            const service = new SubstrateNodeService([], true, false)
            expect(service.port).toBe(NODE_START_PORT)
        })

        it("parses port from --rpc-port arg", () => {
            const service = new SubstrateNodeService(["binary", "--rpc-port=9955"])
            expect(service.port).toBe(9955)
        })

        it("uses port 8545 when useAnvil is true and no port arg", () => {
            const service = new SubstrateNodeService([], true, true)
            expect(service.port).toBe(8545)
        })

        it("strips the first command arg (binary path)", () => {
            const service = new SubstrateNodeService(
                ["/path/to/binary", "--dev", "--rpc-port=9944"],
                true,
                false,
            )
            expect(service.port).toBe(9944)
        })
    })

    describe("stop", () => {
        it("kills the process if it exists and is not killed", async () => {
            const service = new SubstrateNodeService(["binary"], false)
            const mockKill = vi.fn()
            service.process = { killed: false, kill: mockKill } as unknown as ChildProcess
            await service.stop()
            expect(mockKill).toHaveBeenCalled()
        })

        it("does not kill the process if already killed", async () => {
            const service = new SubstrateNodeService(["binary"], false)
            const mockKill = vi.fn()
            service.process = { killed: true, kill: mockKill } as unknown as ChildProcess
            await service.stop()
            expect(mockKill).not.toHaveBeenCalled()
        })

        it("does nothing if process is null", async () => {
            const service = new SubstrateNodeService(["binary"], false)
            await expect(service.stop()).resolves.toBeUndefined()
        })
    })
})

describe("EthRpcService", () => {
    describe("constructor", () => {
        it("defaults to ETH_RPC_ADAPTER_START_PORT when no port arg", () => {
            const service = new EthRpcService()
            expect(service.port).toBe(ETH_RPC_ADAPTER_START_PORT)
        })

        it("parses port from --rpc-port arg", () => {
            const service = new EthRpcService(["--rpc-port=9090"])
            expect(service.port).toBe(9090)
        })
    })

    describe("stop", () => {
        it("kills the process if alive", async () => {
            const service = new EthRpcService([], false)
            const mockKill = vi.fn()
            service.process = { killed: false, kill: mockKill } as unknown as ChildProcess
            await service.stop()
            expect(mockKill).toHaveBeenCalled()
        })

        it("does nothing if no process", async () => {
            const service = new EthRpcService()
            await expect(service.stop()).resolves.toBeUndefined()
        })
    })
})

describe("ChopsticksService", () => {
    describe("constructor", () => {
        it("defaults to NODE_START_PORT when no port arg", () => {
            const service = new ChopsticksService()
            expect(service.port).toBe(NODE_START_PORT)
        })

        it("parses port from --port arg", () => {
            const service = new ChopsticksService(["--port=9955"])
            expect(service.port).toBe(9955)
        })
    })

    describe("stop", () => {
        it("kills the process if alive", async () => {
            const service = new ChopsticksService(["npx", "chopsticks"], false)
            const mockKill = vi.fn()
            service.process = { killed: false, kill: mockKill } as unknown as ChildProcess
            await service.stop()
            expect(mockKill).toHaveBeenCalled()
        })

        it("does nothing if no process", async () => {
            const service = new ChopsticksService()
            await expect(service.stop()).resolves.toBeUndefined()
        })
    })
})
