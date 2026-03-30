import { Wallet, JsonRpcProvider } from "ethers"
import fs from "fs"
import fg from "fast-glob"
import chalk from "chalk"
import type {
    EdrNetworkConfig,
    HttpNetworkAccountsConfig,
} from "hardhat/types/config"
import { createClient, Binary } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import path from "path"

import { PolkadotNodePluginError } from "../errors.js"
import { getPolkadotRpcUrl } from "../utils.js"

const MAGIC_DEPLOY_ADDRESS = "0x6d6f646c70792f70616464720000000000000000"
const ENDOWED_ACCOUNT_SS58 = "5Ha8yXQgvWcvpFya1BmjtJX386xUskafNTzU4Zmb6B3UwYd9"
const MAX_U_128 = BigInt("0xffffffffffffffffffffffffffffffff") // 2^128 - 1

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
    ethRpcUrl: EdrNetworkConfig["url"],
    polkadotRpcUrl: EdrNetworkConfig["polkadotUrl"],
    accounts: string[] | HttpNetworkAccountsConfig,
    useAnvil?: boolean,
) {
    // Scan all build-info output files from both artifacts/ and cache/test-artifacts/
    // HH3 splits build-info into .json (input) and .output.json (output)
    const artifactsDir = path.dirname(pathToArtifacts.endsWith("/") ? pathToArtifacts.slice(0, -1) : pathToArtifacts)
    let files = await fg.glob([
        `${pathToArtifacts}/build-info/*.output.json`,
        `${artifactsDir}/cache/test-artifacts/build-info/*.output.json`,
    ])
    if (files.length === 0) {
        // Fallback for HH2 format where output is in the main .json file
        files = await fg.glob(`${pathToArtifacts}/build-info/*.json`)
    }
    if (files.length === 0) return

    // Process all build-info files to find factory dependencies
    for (const file of files) {
        const buildInfoRaw = JSON.parse(fs.readFileSync(file, "utf8"))
        const output = buildInfoRaw.output ?? buildInfoRaw
        if (!output.contracts) continue
        await processFactoryDeps(output, pathToArtifacts, ethRpcUrl, polkadotRpcUrl, accounts, useAnvil)
    }
}

async function processFactoryDeps(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: any,
    pathToArtifacts: string,
    ethRpcUrl: EdrNetworkConfig["url"],
    polkadotRpcUrl: EdrNetworkConfig["polkadotUrl"],
    accounts: string[] | HttpNetworkAccountsConfig,
    useAnvil?: boolean,
) {
    for (const [_, contracts] of Object.entries(output.contracts)) {
        for (const [parentContractName, artifact] of Object.entries(contracts as Contracts)) {
            const factoryDependencies = artifact.factoryDependencies
            if (!factoryDependencies || Object.keys(factoryDependencies).length === 0) continue

            const ethProvider = new JsonRpcProvider(ethRpcUrl)
            const wallet = new Wallet(getPrivateKey(accounts, useAnvil), ethProvider)
            const dotProvider = getWsProvider(
                getPolkadotRpcUrl(ethRpcUrl, polkadotRpcUrl, useAnvil),
            )
            const client = createClient(dotProvider)
            const api = client.getUnsafeApi()
            const unsafeToken = await api.runtimeToken

            for (const [hash, identifier] of Object.entries(factoryDependencies)) {
                // check if code hash already exists
                const code = await api.query.Revive.PristineCode.getValue(Binary.fromHex(hash))
                if (code) continue

                const [sourcePath, childContractName] = identifier.split(":")
                console.info(
                    chalk.yellow(`Uploading factory dependency in ${parentContractName}...`),
                )
                // get the bytecode from the artifact
                // The sourcePath may have a "project/" prefix from the build-info
                const cleanSourcePath = sourcePath.replace(/^project\//, "")
                let artifactPath = path.join(pathToArtifacts, cleanSourcePath, `${childContractName}.json`)
                if (!fs.existsSync(artifactPath)) {
                    // Fallback: try with original path
                    artifactPath = path.join(pathToArtifacts, sourcePath, `${childContractName}.json`)
                }
                const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"))
                const bytecode = artifact.bytecode?.object ?? artifact.bytecode

                // estimate the storage deposit limit
                const uploadCodeApi = await api.apis.ReviveApi.upload_code(
                    ENDOWED_ACCOUNT_SS58, // not relevant
                    Binary.fromHex(bytecode),
                    MAX_U_128,
                )

                // upload the bytecode through the ETH RPC
                const call = api.tx.Revive.upload_code({
                    code: Binary.fromHex(bytecode),
                    storage_deposit_limit: uploadCodeApi.value?.deposit ?? MAX_U_128,
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
    accounts: string[] | HttpNetworkAccountsConfig,
    useAnvil: boolean = true,
): string {
    if (Array.isArray(accounts)) {
        if (accounts.length === 0) throw new PolkadotNodePluginError("Accounts array is empty.")

        if (accounts.length > 1 && useAnvil) {
            return accounts[1] as string
        }

        if (typeof accounts[0] === "string") return accounts[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (accounts[0] as any).privateKey
    }
    throw new PolkadotNodePluginError("Could not retrieve private key.")
}
