import { describe, it, expect, vi, beforeEach } from "vitest"

function createMockService() {
    return {
        port: 9944,
        process: null,
        container: null,
        from_binary: vi.fn().mockResolvedValue(undefined),
        from_docker: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn().mockResolvedValue(undefined),
        waitForNodeToBeReady: vi.fn().mockResolvedValue(undefined),
        waitForEthRpcToBeReady: vi.fn().mockResolvedValue(undefined),
    }
}

let mockSubstrateService: ReturnType<typeof createMockService>
let mockEthRpcService: ReturnType<typeof createMockService>
let mockChopsticksService: ReturnType<typeof createMockService>

vi.mock("dockerode", () => ({ default: vi.fn() }))

vi.mock("../src/services/substrate-node", () => {
    return {
        SubstrateNodeService: class {
            port: number
            process = null
            container = null
            constructor() {
                Object.assign(this, mockSubstrateService)
                this.port = mockSubstrateService.port
            }
            from_binary = mockSubstrateService.from_binary
            from_docker = mockSubstrateService.from_docker
            stop = mockSubstrateService.stop
            waitForNodeToBeReady = mockSubstrateService.waitForNodeToBeReady
        },
    }
})

vi.mock("../src/services/eth-rpc", () => {
    return {
        EthRpcService: class {
            port: number
            process = null
            container = null
            constructor() {
                Object.assign(this, mockEthRpcService)
                this.port = mockEthRpcService.port
            }
            from_binary = mockEthRpcService.from_binary
            from_docker = mockEthRpcService.from_docker
            stop = mockEthRpcService.stop
            waitForEthRpcToBeReady = mockEthRpcService.waitForEthRpcToBeReady
        },
    }
})

vi.mock("../src/services/chopsticks", () => {
    return {
        ChopsticksService: class {
            port: number
            process = null
            container = null
            constructor() {
                Object.assign(this, mockChopsticksService)
                this.port = mockChopsticksService.port
            }
            from_binary = mockChopsticksService.from_binary
            from_docker = mockChopsticksService.from_docker
            stop = mockChopsticksService.stop
        },
    }
})

import { createRpcServer } from "../src/rpc-server"

describe("createRpcServer", () => {
    beforeEach(() => {
        mockSubstrateService = createMockService()
        mockEthRpcService = createMockService()
        mockChopsticksService = createMockService()
        vi.clearAllMocks()
    })

    it("returns an object with services, listen, and stop methods", () => {
        const server = createRpcServer({ useAnvil: false })
        expect(server).toHaveProperty("services")
        expect(server).toHaveProperty("listen")
        expect(server).toHaveProperty("stop")
    })

    it("returns null services before listen is called", () => {
        const server = createRpcServer({ useAnvil: false })
        const services = server.services()
        expect(services.substrateNodeService).toBeNull()
        expect(services.ethRpcService).toBeNull()
        expect(services.chopsticksService).toBeNull()
    })

    describe("listen - anvil mode", () => {
        it("starts only substrate node from binary with explicit path", async () => {
            const server = createRpcServer({
                useAnvil: true,
                nodePath: "/path/to/anvil",
            })
            await server.listen()

            const services = server.services()
            expect(services.substrateNodeService).not.toBeNull()
            expect(mockSubstrateService.from_binary).toHaveBeenCalledWith("/path/to/anvil")
            expect(mockEthRpcService.from_binary).not.toHaveBeenCalled()
        })

        it("uses default anvil-polkadot binary when no nodePath provided", async () => {
            const server = createRpcServer({
                useAnvil: true,
            })
            await server.listen()

            expect(mockSubstrateService.from_binary).toHaveBeenCalledWith("anvil-polkadot")
            expect(mockEthRpcService.from_binary).not.toHaveBeenCalled()
        })
    })

    describe("listen - binary mode (non-forking)", () => {
        it("starts both substrate node and eth-rpc from binaries", async () => {
            const server = createRpcServer({
                useAnvil: false,
                nodePath: "/path/to/node",
                adapterPath: "/path/to/adapter",
            })
            await server.listen()

            expect(mockSubstrateService.from_binary).toHaveBeenCalledWith("/path/to/node")
            expect(mockEthRpcService.from_binary).toHaveBeenCalledWith("/path/to/adapter")
        })
    })

    describe("listen - forking mode (binary)", () => {
        it("starts chopsticks and eth-rpc from binaries", async () => {
            const server = createRpcServer({
                useAnvil: false,
                adapterPath: "/path/to/adapter",
                isForking: true,
            })
            await server.listen()

            expect(mockChopsticksService.from_binary).toHaveBeenCalledWith("")
            expect(mockEthRpcService.from_binary).toHaveBeenCalledWith("/path/to/adapter")
        })
    })

    describe("listen - throws on invalid config", () => {
        it("throws when no paths or docker provided", () => {
            const server = createRpcServer({ useAnvil: false })
            expect(() => server.listen()).toThrow("Wrong hardhat network configuration")
        })

        it("throws when only nodePath provided without adapterPath", () => {
            const server = createRpcServer({
                useAnvil: false,
                nodePath: "/path/to/node",
            })
            expect(() => server.listen()).toThrow("Wrong hardhat network configuration")
        })
    })

    describe("stop", () => {
        it("stops all services after listen", async () => {
            const server = createRpcServer({
                useAnvil: true,
                nodePath: "/path/to/anvil",
            })
            await server.listen()
            await server.stop()

            expect(mockSubstrateService.stop).toHaveBeenCalled()
            expect(mockEthRpcService.stop).toHaveBeenCalled()
            expect(mockChopsticksService.stop).toHaveBeenCalled()
        })
    })
})
