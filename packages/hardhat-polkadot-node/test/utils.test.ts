import { describe, it, expect, vi } from "vitest"
import net from "net"

vi.mock("run-container", () => ({ runSimple: vi.fn(), run: vi.fn() }))

vi.mock("../src/services/index.js", async () => {
    abstract class Service {
        public process: unknown = null
        public container: unknown = null
        constructor(
            protected commandArgs: string[],
            protected blockProcess: boolean,
        ) {}
        protected _handleOnExit(_name: string) {
            return () => {}
        }
        protected _handleOnError(_name: string, rejectFn: (error: Error) => void) {
            return (error: Error) => {
                rejectFn(error)
            }
        }
        abstract from_binary(pathToBinary: string): Promise<void>
        abstract from_docker(...args: unknown[]): Promise<void>
    }
    return { Service }
})

import {
    constructCommandArgs,
    isPortAvailable,
    getAvailablePort,
    adjustTaskArgsForPort,
    getNetworkConfig,
    getDockerSocketPath,
    getPolkadotRpcUrl,
} from "../src/utils.js"

describe("constructCommandArgs", () => {
    it("defaults to anvil mode when no args provided", () => {
        const result = constructCommandArgs()
        expect(result.nodeCommands).toEqual(["", "--accounts", "20"])
        expect(result.adapterCommands).toEqual([])
    })

    it("defaults to anvil mode when all args are undefined", () => {
        const result = constructCommandArgs({})
        expect(result.nodeCommands).toEqual(["", "--accounts", "20"])
        expect(result.adapterCommands).toEqual([])
    })

    it("configures anvil mode with --accounts flag", () => {
        const result = constructCommandArgs({
            nodeCommands: { useAnvil: true },
        })
        expect(result.nodeCommands).toEqual(["", "--accounts", "20"])
        expect(result.adapterCommands).toEqual([])
    })

    it("does not use anvil mode when forking is also set", () => {
        const result = constructCommandArgs({
            nodeCommands: { useAnvil: true },
            forking: { url: "http://example.com", enabled: true },
        })
        expect(result.nodeCommands).not.toContain("--accounts")
        expect(result.nodeCommands).toContain("npx")
    })

    it("configures forking with chopsticks", () => {
        const result = constructCommandArgs({
            forking: { url: "wss://rpc.example.com", enabled: true },
        })
        expect(result.nodeCommands).toContain("npx")
        expect(result.nodeCommands).toContain("@acala-network/chopsticks@latest")
        expect(result.nodeCommands).toContain("--endpoint=wss://rpc.example.com")
        expect(result.nodeCommands).toContain("--build-block-mode=Instant")
    })

    it("uses custom build block mode when forking", () => {
        const result = constructCommandArgs({
            forking: { url: "wss://rpc.example.com", enabled: true },
            adapterCommands: { buildBlockMode: "Batch" },
        })
        expect(result.nodeCommands).toContain("--build-block-mode=Batch")
    })

    it("sets node rpc port with --port for forking mode", () => {
        const result = constructCommandArgs({
            forking: { url: "wss://rpc.example.com", enabled: true },
            nodeCommands: { rpcPort: 9955 },
        })
        expect(result.nodeCommands).toContain("--port=9955")
        expect(result.adapterCommands).toContain("--node-rpc-url=ws://localhost:9955")
    })

    it("sets node rpc port with --rpc-port for non-forking mode", () => {
        const result = constructCommandArgs({
            nodeCommands: { useAnvil: false, nodeBinaryPath: "/path/to/node", rpcPort: 9955 },
        })
        expect(result.nodeCommands).toContain("--rpc-port=9955")
        expect(result.adapterCommands).toContain("--node-rpc-url=ws://localhost:9955")
    })

    it("defaults adapter node-rpc-url to port 9944 when no rpc port specified", () => {
        const result = constructCommandArgs({
            nodeCommands: { useAnvil: false, nodeBinaryPath: "/path/to/node" },
        })
        expect(result.adapterCommands).toContain("--node-rpc-url=ws://localhost:9944")
    })

    it("sets adapter port", () => {
        const result = constructCommandArgs({
            nodeCommands: { useAnvil: false, nodeBinaryPath: "/path/to/node" },
            adapterCommands: { adapterPort: 8546 },
        })
        expect(result.adapterCommands).toContain("--rpc-port=8546")
    })

    it("throws when adapter and node share the same port", () => {
        expect(() =>
            constructCommandArgs({
                nodeCommands: { useAnvil: false, nodeBinaryPath: "/path/to/node", rpcPort: 8545 },
                adapterCommands: { adapterPort: 8545 },
            }),
        ).toThrow("Adapter and node cannot share the same port.")
    })

    it("configures consensus for manual seal with period", () => {
        const result = constructCommandArgs({
            nodeCommands: {
                useAnvil: false,
                nodeBinaryPath: "/path/to/node",
                consensus: { seal: "Manual", period: 100 },
            },
        })
        expect(result.nodeCommands).toContain("--consensus=manual-seal-100")
    })

    it("configures consensus for manual seal without valid period", () => {
        const result = constructCommandArgs({
            nodeCommands: {
                useAnvil: false,
                nodeBinaryPath: "/path/to/node",
                consensus: { seal: "Manual", period: "invalid" },
            },
        })
        expect(result.nodeCommands).toContain("--consensus=manual-seal")
    })

    it("adds dev and pruning flags when dev mode enabled", () => {
        const result = constructCommandArgs({
            nodeCommands: {
                useAnvil: false,
                nodeBinaryPath: "/path/to/node",
                dev: true,
            },
        })
        expect(result.nodeCommands).toContain("--pruning=archive")
        expect(result.nodeCommands).toContain("--dev")
    })

    it("does not add dev flags in forking mode even when dev is true", () => {
        const result = constructCommandArgs({
            forking: { url: "wss://rpc.example.com", enabled: true },
            nodeCommands: {
                nodeBinaryPath: "/path/to/node",
                dev: true,
            },
        })
        expect(result.nodeCommands).not.toContain("--dev")
        expect(result.nodeCommands).not.toContain("--pruning=archive")
    })

    it("adds adapter dev flag", () => {
        const result = constructCommandArgs({
            nodeCommands: { useAnvil: false, nodeBinaryPath: "/path/to/node" },
            adapterCommands: { dev: true },
        })
        expect(result.adapterCommands).toContain("--dev")
    })
})

describe("isPortAvailable", () => {
    it("returns true for an available port", async () => {
        const available = await isPortAvailable(0)
        expect(available).toBe(true)
    })

    it("returns false for a port in use", async () => {
        const server = net.createServer()
        await new Promise<void>((resolve) => server.listen(0, "0.0.0.0", resolve))
        const port = (server.address() as net.AddressInfo).port

        const available = await isPortAvailable(port)
        expect(available).toBe(false)

        await new Promise<void>((resolve) => server.close(() => resolve()))
    })
})

describe("getAvailablePort", () => {
    it("returns the start port if it is available", async () => {
        const server = net.createServer()
        await new Promise<void>((resolve) => server.listen(0, resolve))
        const port = (server.address() as net.AddressInfo).port
        await new Promise<void>((resolve) => server.close(() => resolve()))

        const result = await getAvailablePort(port, 3)
        expect(result).toBeGreaterThanOrEqual(port)
        expect(result).toBeLessThanOrEqual(port + 2)
    })

    it("throws after max attempts", async () => {
        const servers: net.Server[] = []
        const basePort = 19944

        for (let i = 0; i < 3; i++) {
            const server = net.createServer()
            await new Promise<void>((resolve) => server.listen(basePort + i, "0.0.0.0", resolve))
            servers.push(server)
        }

        try {
            await expect(getAvailablePort(basePort, 3)).rejects.toThrow(
                "Couldn't find an available port",
            )
        } finally {
            await Promise.all(
                servers.map((s) => new Promise<void>((resolve) => s.close(() => resolve()))),
            )
        }
    })
})

describe("adjustTaskArgsForPort", () => {
    it("updates existing --port argument", () => {
        const args = ["--some-flag", "--port", "9944"]
        const result = adjustTaskArgsForPort(args, 8545)
        expect(result).toEqual(["--some-flag", "--port", "8545"])
    })

    it("adds --port when not present", () => {
        const args = ["--some-flag"]
        const result = adjustTaskArgsForPort(args, 8545)
        expect(result).toEqual(["--some-flag", "--port", "8545"])
    })

    it("throws when --port is last arg without a value", () => {
        const args = ["--port"]
        expect(() => adjustTaskArgsForPort(args, 8545)).toThrow(
            "Invalid task arguments: --port provided without a following port number.",
        )
    })

    it("handles empty args array", () => {
        const result = adjustTaskArgsForPort([], 8545)
        expect(result).toEqual(["--port", "8545"])
    })
})

describe("getNetworkConfig", () => {
    it("returns a config with the given url", () => {
        const config = getNetworkConfig("http://localhost:8545")
        expect(config.url).toBe("http://localhost:8545")
        expect(config.accounts).toBe("remote")
        expect(config.gas).toBe("auto")
        expect(config.gasPrice).toBe("auto")
        expect(config.gasMultiplier).toBe(1)
        expect(config.timeout).toBe(20000)
        expect(config.httpHeaders).toEqual({})
    })
})

describe("getDockerSocketPath", () => {
    it("returns default socket path when docker is true", () => {
        const socketPath = getDockerSocketPath(true)
        expect(typeof socketPath).toBe("string")
        expect(socketPath).toMatch(/docker\.sock$/)
    })

    it("returns custom socket path when docker is a string", () => {
        const customPath = "/custom/docker.sock"
        const socketPath = getDockerSocketPath(customPath)
        expect(socketPath).toBe(customPath)
    })

    it("returns default socket path when docker is false", () => {
        const socketPath = getDockerSocketPath(false)
        expect(typeof socketPath).toBe("string")
        expect(socketPath).toMatch(/docker\.sock$/)
    })
})

describe("getPolkadotRpcUrl", () => {
    it("returns ws://localhost:9944 when useAnvil is true", () => {
        const url = getPolkadotRpcUrl("http://localhost:8545", undefined, true)
        expect(url).toBe("ws://localhost:9944")
    })

    it("returns explicit polkadotRpcUrl when provided", () => {
        const url = getPolkadotRpcUrl("http://localhost:8545", "wss://custom.rpc.com", false)
        expect(url).toBe("wss://custom.rpc.com")
    })

    it("infers polkadot RPC from known ETH RPC URLs", () => {
        const url = getPolkadotRpcUrl(
            "https://testnet-passet-hub-eth-rpc.polkadot.io",
            undefined,
            false,
        )
        expect(url).toBe("wss://testnet-passet-hub.polkadot.io")
    })

    it("infers kusama asset hub RPC URL", () => {
        const url = getPolkadotRpcUrl(
            "https://kusama-asset-hub-eth-rpc.polkadot.io",
            undefined,
            false,
        )
        expect(url).toBe("wss://asset-hub-kusama-rpc.dwellir.com")
    })

    it("infers westend asset hub RPC URL", () => {
        const url = getPolkadotRpcUrl(
            "https://westend-asset-hub-eth-rpc.polkadot.io",
            undefined,
            false,
        )
        expect(url).toBe("wss://asset-hub-westend-rpc.dwellir.com")
    })

    it("throws when no polkadot URL can be resolved and useAnvil is false", () => {
        expect(() => getPolkadotRpcUrl("http://unknown-rpc.example.com", undefined, false)).toThrow(
            "Factory dependencies found",
        )
    })
})
