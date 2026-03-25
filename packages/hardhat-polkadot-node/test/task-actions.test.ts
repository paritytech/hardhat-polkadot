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

const { mockListen, mockStop, mockWaitNode, mockWaitEthRpc } = vi.hoisted(() => ({
    mockListen: vi.fn().mockResolvedValue(undefined),
    mockStop: vi.fn().mockResolvedValue(undefined),
    mockWaitNode: vi.fn().mockResolvedValue(undefined),
    mockWaitEthRpc: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("../src/rpc-server.js", () => ({
    createRpcServer: vi.fn().mockReturnValue({
        listen: mockListen,
        stop: mockStop,
        services: () => ({
            substrateNodeService: { waitForNodeToBeReady: mockWaitNode },
            ethRpcService: { waitForEthRpcToBeReady: mockWaitEthRpc },
            chopsticksService: null,
        }),
    }),
}))

vi.mock("../src/core/factory-support.js", () => ({
    handleFactoryDependencies: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("../src/utils.js", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/utils.js")>()
    return {
        ...actual,
        configureNetwork: vi.fn().mockResolvedValue(undefined),
        getAvailablePort: vi.fn().mockImplementation((port: number) => Promise.resolve(port)),
    }
})

import nodeAction from "../src/task-actions/node.js"
import testAction from "../src/task-actions/test.js"
import runAction from "../src/task-actions/run.js"
import nodePolkadotAction from "../src/task-actions/node-polkadot.js"
import { createRpcServer } from "../src/rpc-server.js"
import { handleFactoryDependencies } from "../src/core/factory-support.js"

function makeHre(overrides: Record<string, unknown> = {}) {
    return {
        globalOptions: { network: undefined },
        config: {
            networks: {
                default: { polkadot: true, ...overrides },
            },
            paths: { artifacts: "/tmp/artifacts" },
        },
        tasks: {
            getTask: vi.fn().mockReturnValue({
                run: vi.fn().mockResolvedValue(undefined),
            }),
        },
    }
}

describe("node task action", () => {
    beforeEach(() => vi.clearAllMocks())

    it("delegates to runSuper for non-polkadot networks", async () => {
        const hre = makeHre()
        hre.config.networks.default = {} as any
        const runSuper = vi.fn().mockResolvedValue("super")

        const result = await nodeAction({}, hre as any, runSuper)

        expect(runSuper).toHaveBeenCalled()
        expect(result).toBe("super")
    })

    it("delegates to node-polkadot task for polkadot networks", async () => {
        const hre = makeHre()
        const runSuper = vi.fn()

        await nodeAction({}, hre as any, runSuper)

        expect(hre.tasks.getTask).toHaveBeenCalledWith("node-polkadot")
        expect(runSuper).not.toHaveBeenCalled()
    })

    it("delegates to runSuper for non-hardhat network", async () => {
        const hre = makeHre()
        hre.globalOptions.network = "mainnet" as any
        hre.config.networks.mainnet = { polkadot: true } as any
        const runSuper = vi.fn().mockResolvedValue("super")

        await nodeAction({}, hre as any, runSuper)

        expect(runSuper).toHaveBeenCalled()
    })
})

describe("node-polkadot task action", () => {
    beforeEach(() => vi.clearAllMocks())

    it("creates and starts RPC server", async () => {
        const hre = makeHre({ nodeConfig: { useAnvil: true } })

        await nodePolkadotAction({}, hre as any)

        expect(createRpcServer).toHaveBeenCalled()
        expect(mockListen).toHaveBeenCalled()
    })
})

describe("test task action", () => {
    beforeEach(() => vi.clearAllMocks())

    it("delegates to runSuper for non-polkadot networks", async () => {
        const hre = makeHre()
        hre.config.networks.default = {} as any
        const runSuper = vi.fn().mockResolvedValue(0)

        await testAction({ noCompile: true }, hre as any, runSuper)

        expect(runSuper).toHaveBeenCalled()
    })

    it("calls build when noCompile is false", async () => {
        const hre = makeHre({ nodeConfig: { useAnvil: true } })
        const runSuper = vi.fn().mockResolvedValue(0)

        await testAction({ noCompile: false }, hre as any, runSuper)

        expect(hre.tasks.getTask).toHaveBeenCalledWith("build")
    })

    it("skips build when noCompile is true", async () => {
        const hre = makeHre({ nodeConfig: { useAnvil: true } })
        const runSuper = vi.fn().mockResolvedValue(0)

        await testAction({ noCompile: true }, hre as any, runSuper)

        const buildCalls = (hre.tasks.getTask as any).mock.calls.filter(
            (c: string[]) => c[0] === "build",
        )
        expect(buildCalls).toHaveLength(0)
    })

    it("starts server, handles factory deps, and stops server", async () => {
        const hre = makeHre({ nodeConfig: { useAnvil: true } })
        const runSuper = vi.fn().mockResolvedValue(0)

        await testAction({ noCompile: true }, hre as any, runSuper)

        expect(createRpcServer).toHaveBeenCalled()
        expect(mockListen).toHaveBeenCalled()
        expect(handleFactoryDependencies).toHaveBeenCalled()
        expect(runSuper).toHaveBeenCalled()
        expect(mockStop).toHaveBeenCalled()
    })
})

describe("run task action", () => {
    it("delegates to runSuper", async () => {
        const runSuper = vi.fn().mockResolvedValue("done")
        const result = await runAction({ script: "test.ts" }, {} as any, runSuper)

        expect(runSuper).toHaveBeenCalledWith({ script: "test.ts" })
        expect(result).toBe("done")
    })
})
