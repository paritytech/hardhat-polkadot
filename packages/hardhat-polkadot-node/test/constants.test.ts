import { describe, it, expect } from "vitest"

import {
    NODE_START_PORT,
    ETH_RPC_ADAPTER_START_PORT,
    MAX_PORT_ATTEMPTS,
    POLKADOT_NETWORK_ACCOUNTS,
    TASK_NODE_POLKADOT,
    TASK_NODE_POLKADOT_CREATE_SERVER,
    BASE_URL,
    ETH_RPC_TO_SUBSTRATE_RPC,
} from "../src/constants"

describe("constants", () => {
    it("defines correct default ports", () => {
        expect(NODE_START_PORT).toBe(9944)
        expect(ETH_RPC_ADAPTER_START_PORT).toBe(8545)
    })

    it("defines MAX_PORT_ATTEMPTS", () => {
        expect(MAX_PORT_ATTEMPTS).toBeGreaterThan(0)
    })

    it("defines polkadot network accounts as hex strings", () => {
        expect(POLKADOT_NETWORK_ACCOUNTS).toHaveLength(2)
        for (const account of POLKADOT_NETWORK_ACCOUNTS) {
            expect(account).toMatch(/^0x[0-9a-f]+$/)
        }
    })

    it("defines task names", () => {
        expect(TASK_NODE_POLKADOT).toBe("node-polkadot")
        expect(TASK_NODE_POLKADOT_CREATE_SERVER).toBe("node-polkadot:create-server")
    })

    it("defines BASE_URL as localhost", () => {
        expect(BASE_URL).toBe("http://127.0.0.1")
    })

    it("maps ETH RPC URLs to substrate RPC URLs", () => {
        expect(Object.keys(ETH_RPC_TO_SUBSTRATE_RPC).length).toBeGreaterThan(0)
        for (const [ethUrl, substrateUrl] of Object.entries(ETH_RPC_TO_SUBSTRATE_RPC)) {
            expect(ethUrl).not.toMatch(/^https?:\/\//)
            expect(substrateUrl).toMatch(/^wss?:\/\//)
        }
    })
})
