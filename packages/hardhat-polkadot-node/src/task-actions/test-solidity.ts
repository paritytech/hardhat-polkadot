import type { TaskOverrideActionFunction } from "hardhat/types/tasks"
import type { EdrNetworkUserConfig } from "hardhat/types/config"
import chalk from "chalk"
import axios from "axios"
import fs from "fs"
import path from "path"
import fg from "fast-glob"

import { createRpcServer } from "../rpc-server.js"
import { constructCommandArgs, getAvailablePort } from "../utils.js"
import { PolkadotNodePluginError } from "../errors.js"
import { handleFactoryDependencies } from "../core/factory-support.js"
import {
    NODE_START_PORT,
    ETH_RPC_ADAPTER_START_PORT,
    MAX_PORT_ATTEMPTS,
    POLKADOT_NETWORK_ACCOUNTS,
    DEFAULT_NETWORK_NAME,
    BASE_URL,
} from "../constants.js"

interface AbiEntry {
    type: string
    name?: string
    inputs?: { type: string }[]
}

interface TestResult {
    contract: string
    test: string
    passed: boolean
    error?: string
}

let jsonRpcId = 1

async function rpcCall(url: string, method: string, params: unknown[]): Promise<unknown> {
    const response = await axios.post(url, {
        jsonrpc: "2.0",
        id: jsonRpcId++,
        method,
        params,
    })
    if (response.data.error) {
        throw new Error(response.data.error.message ?? JSON.stringify(response.data.error))
    }
    return response.data.result
}

async function sendTransaction(
    url: string,
    params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    // Use eth_sendTransactionSync which waits for the block to be mined
    // and returns the receipt directly (anvil-polkadot specific)
    try {
        const receipt = (await rpcCall(url, "eth_sendTransactionSync", [params])) as Record<
            string,
            unknown
        >
        return receipt
    } catch {
        // Fallback to async send + poll for non-anvil nodes
        const txHash = (await rpcCall(url, "eth_sendTransaction", [params])) as string
        for (let i = 0; i < 30; i++) {
            const receipt = (await rpcCall(url, "eth_getTransactionReceipt", [txHash])) as Record<
                string,
                unknown
            > | null
            if (receipt !== null) return receipt
            await new Promise((r) => setTimeout(r, 100))
        }
        throw new Error(`Transaction ${txHash} not mined after 30 attempts`)
    }
}

async function getFunctionSelector(abi: AbiEntry[], funcName: string): Promise<string | null> {
    const entry = abi.find((e) => e.type === "function" && e.name === funcName)
    if (!entry) return null
    const types = (entry.inputs ?? []).map((i) => i.type).join(",")
    const sig = `${funcName}(${types})`
    try {
        const { id } = await import("ethers")
        return id(sig).slice(0, 10)
    } catch {
        return null
    }
}

function getTestFunctions(abi: AbiEntry[]): string[] {
    return abi
        .filter(
            (e) =>
                e.type === "function" &&
                typeof e.name === "string" &&
                (e.name.startsWith("test") || e.name.startsWith("invariant")),
        )
        .map((e) => e.name!)
}

function hasSetUp(abi: AbiEntry[]): boolean {
    return abi.some((e) => e.type === "function" && e.name === "setUp")
}

const CHECK = "\u2714"

const testSolidityAction: TaskOverrideActionFunction = async (taskArguments, hre, runSuper) => {
    const networkConfig = hre.config.networks[DEFAULT_NETWORK_NAME]
    const isPolkadot = networkConfig && "polkadot" in networkConfig && !!networkConfig.polkadot

    if (!isPolkadot) {
        return runSuper(taskArguments)
    }

    const userConfig = networkConfig as unknown as EdrNetworkUserConfig
    const useAnvil = userConfig?.nodeConfig?.useAnvil !== false

    // Start the polkadot node
    let nodePort = userConfig?.nodeConfig?.rpcPort || NODE_START_PORT
    let adapterPort = userConfig?.adapterConfig?.adapterPort || ETH_RPC_ADAPTER_START_PORT
    nodePort = await getAvailablePort(nodePort, MAX_PORT_ATTEMPTS)
    adapterPort = await getAvailablePort(adapterPort, MAX_PORT_ATTEMPTS)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const forking = (userConfig as any)?.forking as
        | { enabled?: boolean; url?: string; blockNumber?: number }
        | undefined

    const server = createRpcServer({
        useAnvil,
        docker: userConfig?.docker,
        nodePath: userConfig?.nodeConfig?.nodeBinaryPath,
        adapterPath: userConfig?.adapterConfig?.adapterBinaryPath,
        isForking: !!forking?.enabled,
    })

    const nodeCommands = Object.assign({}, userConfig?.nodeConfig, { rpcPort: nodePort })
    const adapterCommands = Object.assign({}, userConfig?.adapterConfig, { adapterPort })
    const commandArgs = constructCommandArgs({
        forking,
        forkBlockNumber: forking?.blockNumber,
        nodeCommands,
        adapterCommands,
    })

    try {
        await server.listen(commandArgs.nodeCommands, commandArgs.adapterCommands, false)
        await server.services().substrateNodeService?.waitForNodeToBeReady()
        if (!useAnvil) await server.services().ethRpcService?.waitForEthRpcToBeReady()

        const localUrl = `${BASE_URL}:${adapterPort}`
        const wsUrl = useAnvil
            ? `ws://localhost:${NODE_START_PORT}`
            : `ws://localhost:${nodePort}`

        // Build test sources first so resolc compiles them to PVM/EVM
        // HH3's test build uses hre.solidity.build() for test files
        const testFiles: string[] = taskArguments.testFiles ?? []
        const grep: string | undefined = taskArguments.grep

        // Find test source files
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const testDir = (hre.config.paths as any).tests?.solidity ?? path.join(hre.config.paths.root, "test")

        let rootFilePaths: string[]
        if (testFiles.length > 0) {
            rootFilePaths = testFiles.map((f: string) => path.resolve(hre.config.paths.root, f))
        } else {
            rootFilePaths = await fg.glob(`${testDir}/**/*.sol`)
            // Also include *.t.sol from source directories
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const srcPaths = (hre.config.paths as any).sources?.solidity
            const sourceDirs: string[] = Array.isArray(srcPaths)
                ? srcPaths
                : [srcPaths ?? path.join(hre.config.paths.root, "contracts")]
            for (const dir of sourceDirs) {
                rootFilePaths.push(...(await fg.glob(`${dir}/**/*.t.sol`)))
            }
        }
        rootFilePaths = Array.from(new Set(rootFilePaths))

        // Build test sources through HH3's solidity build system (triggers resolc)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (rootFilePaths.length > 0 && (hre as any).solidity?.build) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (hre as any).solidity.build(rootFilePaths, {
                force: false,
                buildProfile: hre.globalOptions.buildProfile ?? "default",
                quiet: true,
            })
        }

        // Upload factory dependencies after test build so all build-info files exist
        await handleFactoryDependencies(
            hre.config.paths.artifacts,
            localUrl,
            wsUrl,
            POLKADOT_NETWORK_ACCOUNTS,
            useAnvil,
        )

        // Collect test artifacts from both main artifacts and test-artifacts
        // HH3 puts test artifacts in cache/test-artifacts/, not in artifacts/
        const artifactFiles: { sourceName: string; contractName: string; abi: AbiEntry[]; bytecode: string }[] = []

        // Scan main artifacts
        const mainArtifactFiles = await fg.glob(`${hre.config.paths.artifacts}/**/*.json`, {
            ignore: ["**/build-info/**", "**/*.d.ts"],
        })
        for (const f of mainArtifactFiles) {
            try {
                const data = JSON.parse(fs.readFileSync(f, "utf8"))
                if (data.abi && data.bytecode) {
                    artifactFiles.push({
                        sourceName: data.sourceName ?? "",
                        contractName: data.contractName ?? path.basename(f, ".json"),
                        abi: typeof data.abi === "string" ? JSON.parse(data.abi) : data.abi,
                        bytecode: data.bytecode,
                    })
                }
            } catch { /* skip non-artifact json */ }
        }

        // Scan test-artifacts (HH3 cache)
        const cachePath = hre.config.paths.cache
        const testArtifactFiles = await fg.glob(`${cachePath}/test-artifacts/**/*.json`)
        for (const f of testArtifactFiles) {
            try {
                const data = JSON.parse(fs.readFileSync(f, "utf8"))
                if (data.abi && data.bytecode) {
                    artifactFiles.push({
                        sourceName: data.sourceName ?? "",
                        contractName: data.contractName ?? path.basename(f, ".json"),
                        abi: typeof data.abi === "string" ? JSON.parse(data.abi) : data.abi,
                        bytecode: data.bytecode,
                    })
                }
            } catch { /* skip */ }
        }

        const results: TestResult[] = []
        const accounts = (await rpcCall(localUrl, "eth_accounts", [])) as string[]
        const sender = accounts[0]

        if (!sender) {
            throw new PolkadotNodePluginError("No accounts available on the node")
        }

        const testStartTime = Date.now()

        console.log()
        console.log("Running Solidity tests against polkadot node")
        console.log()

        for (const artifact of artifactFiles) {
            const abi = artifact.abi
            const testFns = getTestFunctions(abi)
            if (testFns.length === 0) continue

            const matchingTests = grep
                ? testFns.filter((n) => n.includes(grep) || new RegExp(grep).test(n))
                : testFns
            if (matchingTests.length === 0) continue

            if (testFiles.length > 0) {
                if (!testFiles.some((f) => artifact.sourceName.includes(f))) {
                    continue
                }
            }

            const label = `${artifact.sourceName}:${artifact.contractName}`
            console.log(`  ${label}`)

            // Each test function gets a fresh contract deployment to
            // isolate state (same as forge/EDR behaviour).
            for (const testName of matchingTests) {
                // Deploy a fresh instance
                let contractAddress: string
                try {
                    const receipt = await sendTransaction(localUrl, {
                        from: sender, data: artifact.bytecode, value: "0x0",
                    })
                    if (!receipt || receipt.status !== "0x1" || !receipt.contractAddress) {
                        throw new Error(`deployment reverted (status=${receipt?.status})`)
                    }
                    contractAddress = receipt.contractAddress as string
                } catch (err) {
                    results.push({ contract: label, test: testName, passed: false, error: `Deploy failed: ${err}` })
                    console.log(chalk.red(`    ${results.filter((r) => !r.passed).length}) ${testName}()`))
                    continue
                }

                // setUp()
                if (hasSetUp(abi)) {
                    const sel = await getFunctionSelector(abi, "setUp")
                    if (sel) {
                        try {
                            const receipt = await sendTransaction(localUrl, {
                                from: sender, to: contractAddress, data: sel, value: "0x0",
                            })
                            if (receipt.status !== "0x1") throw new Error("reverted")
                        } catch (err) {
                            results.push({ contract: label, test: testName, passed: false, error: `setUp() failed: ${err}` })
                            console.log(chalk.red(`    ${results.filter((r) => !r.passed).length}) ${testName}()`))
                            continue
                        }
                    }
                }

                // Run the test
                const sel = await getFunctionSelector(abi, testName)
                if (!sel) {
                    results.push({ contract: label, test: testName, passed: false, error: "Cannot compute selector" })
                    console.log(chalk.red(`    ${results.filter((r) => !r.passed).length}) ${testName}()`))
                    continue
                }

                try {
                    const receipt = await sendTransaction(localUrl, {
                        from: sender, to: contractAddress, data: sel, value: "0x0",
                    })

                    if (receipt.status === "0x1") {
                        results.push({ contract: label, test: testName, passed: true })
                        console.log(chalk.green(`    ${CHECK} ${testName}()`))
                    } else {
                        results.push({ contract: label, test: testName, passed: false, error: "Transaction reverted" })
                        console.log(chalk.red(`    ${results.filter((r) => !r.passed).length}) ${testName}()`))
                    }
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err)
                    results.push({ contract: label, test: testName, passed: false, error: msg })
                    console.log(chalk.red(`    ${results.filter((r) => !r.passed).length}) ${testName}()`))
                }
            }

            console.log()
        }

        const passed = results.filter((r) => r.passed).length
        const failed = results.filter((r) => !r.passed).length

        if (failed > 0) {
            console.log()
            results
                .filter((r) => !r.passed)
                .forEach((r, i) => {
                    console.log(chalk.red(`  ${i + 1}) ${r.contract}#${r.test}()`))
                    if (r.error) console.log(chalk.red(`    Error: ${r.error}`))
                })
            console.log()
        }

        const elapsed = ((Date.now() - testStartTime) / 1000).toFixed(1)
        const parts = []
        if (passed > 0) parts.push(chalk.green(`${passed} passing`))
        if (failed > 0) parts.push(chalk.red(`${failed} failing`))
        console.log(`${parts.join(" ")} (${results.length} solidity, ${elapsed}s)`)

        if (failed > 0) {
            process.exitCode = 1
        }
    } finally {
        await server.stop()
    }
}

export default testSolidityAction
