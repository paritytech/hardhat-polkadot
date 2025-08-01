import { Wallet, JsonRpcProvider } from "ethers"
import fs from "fs"
import { glob } from "fast-glob"
import { EthereumProvider } from "hardhat/types"
import { ApiPromise, WsProvider } from "@polkadot/api"
import { hexToU8a, u8aToHex } from "@polkadot/util"
import path from "path"

const MAGIC_DEPLOY_ADDRESS = "0x6d6f646c70792f70616464720000000000000000"

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
    provider: EthereumProvider,
    ethUrl: string,
    polkadotUrl: string,
    account: string,
) {
    // get last build info file
    const files = await glob(`${pathToArtifacts}/build-info/*.json`)
    files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    const lastBuildInfo = JSON.parse(fs.readFileSync(files[0], "utf8"))

    for (const [_, contracts] of Object.entries(lastBuildInfo.output.contracts)) {
        for (const [_, artifact] of Object.entries(contracts as Contracts)) {
            const factoryDependencies = artifact.factoryDependencies
            if (!factoryDependencies || Object.keys(factoryDependencies).length === 0) continue

            const provider = new JsonRpcProvider(ethUrl)
            console.log("0", account)
            const wallet = new Wallet(account, provider as any)
            const ws = new WsProvider(polkadotUrl)
            const api = await ApiPromise.create({ provider: ws })
            await api.isReady

            for (const [hash, identifier] of Object.entries(factoryDependencies)) {
                // check if code exists
                const codeExists = await api.query.revive
                    .pristineCode(hexToU8a(`0x${hash}`))
                    .then((code) => code.isSome)

                if (codeExists) continue

                const [sourcePath, contractName] = identifier.split(":")
                const artifactPath = path.join(pathToArtifacts, sourcePath, `${contractName}.json`)
                const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"))
                const bytecode = artifact.bytecode?.object ?? artifact.bytecode

                const call = api.tx.revive.uploadCode(bytecode, 10000000000000000000n)
                const payload = call.method.toU8a()
                const tx = await wallet.sendTransaction({
                    to: MAGIC_DEPLOY_ADDRESS,
                    data: u8aToHex(payload),
                })
                await tx.wait()
            }
        }
    }
}
