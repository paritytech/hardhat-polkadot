import { Wallet, JsonRpcProvider } from "ethers"
import fs from "fs"
import { glob } from "fast-glob"
import chalk from "chalk"
import {
    HardhatNetworkAccountsConfig,
    HardhatNetworkConfig,
    HttpNetworkAccountsConfig,
} from "hardhat/types"
import { createClient, Binary } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import path from "path"

import { PolkadotNodePluginError } from "../errors"
import { getPolkadotRpcUrl } from "../utils"

const MAGIC_DEPLOY_ADDRESS = "0x6d6f646c70792f70616464720000000000000000"
const DEFAULT_UPLOAD_CODE_GAS_LIMIT = 10_000_000_000_000_000_000_000_000_000_000n

type Contracts = Record<
    string,
    {
        factoryDependencies?: Record<string, string>
    }
>

/**
 * Uploads factory dependencies (child contract bytecodes) if not already deployed.
 */
export async function handleFactoryDependencies(
    pathToArtifacts: string,
    ethRpcUrl: HardhatNetworkConfig["url"],
    polkadotRpcUrl: HardhatNetworkConfig["polkadotUrl"],
    accounts: string[] | HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig,
) {
    // get last build info file
    const files = await glob(`${pathToArtifacts}/build-info/*.json`)
    if (files.length === 0) return
    files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    const lastBuildInfo = JSON.parse(fs.readFileSync(files[0], "utf8"))

    for (const [_, contracts] of Object.entries(lastBuildInfo.output.contracts)) {
        for (const [_, artifact] of Object.entries(contracts as Contracts)) {
            const factoryDependencies = artifact.factoryDependencies
            if (!factoryDependencies || Object.keys(factoryDependencies).length === 0) continue

            const ethProvider = new JsonRpcProvider(ethRpcUrl)
            const wallet = new Wallet(getPrivateKey(accounts), ethProvider)
            const dotProvider = getWsProvider(getPolkadotRpcUrl(ethRpcUrl, polkadotRpcUrl))
            const client = createClient(dotProvider)
            const api = client.getUnsafeApi()
            const unsafeToken = await api.runtimeToken

            for (const [hash, identifier] of Object.entries(factoryDependencies)) {
                // check if hash code already exist
                const code = await api.query.Revive.PristineCode.getValue(Binary.fromHex(hash))
                if (code) continue

                console.info(
                    chalk.yellow(
                        `Factory dependency ${identifier} found but not uploaded yet. Uploading...`,
                    ),
                )
                // get the bytecode from the artifact
                const [sourcePath, contractName] = identifier.split(":")
                const artifactPath = path.join(pathToArtifacts, sourcePath, `${contractName}.json`)
                const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"))
                const bytecode = artifact.bytecode?.object ?? artifact.bytecode

                // upload the bytecode throught the ETH RPC
                const call = api.tx.Revive.upload_code({
                    code: Binary.fromHex(bytecode),
                    storage_deposit_limit: DEFAULT_UPLOAD_CODE_GAS_LIMIT,
                })
                const payload = call.getEncodedData(unsafeToken)
                const tx = await wallet.sendTransaction({
                    to: MAGIC_DEPLOY_ADDRESS,
                    data: payload.asHex(),
                })
                await tx.wait()
            }

            client.destroy()
        }
    }
}

function getPrivateKey(
    accounts: string[] | HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig,
): string {
    if (Array.isArray(accounts)) {
        if (accounts.length === 0) throw new PolkadotNodePluginError("Accounts array is empty.")
        if (typeof accounts[0] === "string") return accounts[0]
        return accounts[0].privateKey
    }
    throw new PolkadotNodePluginError("Could not retrieve private key.")
}
