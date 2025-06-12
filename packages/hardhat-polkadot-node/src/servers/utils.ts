import axios from "axios"

import { BASE_URL, RPC_ENDPOINT_PATH } from "../constants"
import { PolkadotNodePluginError } from "../errors"

export async function waitForNodeToBeReady(port: number, maxAttempts = 20): Promise<void> {
    const endpoint = `${BASE_URL}:${port}`
    const payload = {
        jsonrpc: "2.0",
        method: "state_getRuntimeVersion",
        params: [],
        id: 1,
    }
    await waitForServiceToBeReady(endpoint, payload, maxAttempts)
}

export async function waitForEthRpcToBeReady(port: number, maxAttempts = 20): Promise<void> {
    const endpoint = `${BASE_URL}:${port}`
    const payload = {
        jsonrpc: "2.0",
        method: RPC_ENDPOINT_PATH,
        params: [],
        id: 1,
    }
    await waitForServiceToBeReady(endpoint, payload, maxAttempts)
}

async function waitForServiceToBeReady(
    endpoint: string,
    payload: object,
    maxAttempts: number,
): Promise<void> {
    let attempts = 0
    let waitTime = 1000
    const backoffFactor = 2
    const maxWaitTime = 30000

    while (attempts < maxAttempts) {
        try {
            const response = await axios.post(endpoint, payload)

            if (response.status == 200) {
                return
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (_e: any) {
            // If it fails, it will just try again
        }

        attempts++

        await new Promise((r) => setTimeout(r, waitTime))

        waitTime = Math.min(waitTime * backoffFactor, maxWaitTime)
    }

    throw new PolkadotNodePluginError("Server didn't respond after multiple attempts")
}
