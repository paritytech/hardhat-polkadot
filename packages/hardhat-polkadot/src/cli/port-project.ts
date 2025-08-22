import { spawnSync } from "child_process"
import os from "os"
import fs from "fs"
import chalk from "chalk"
import path from "path"
import jscodeshiftFactory from "jscodeshift"
import { patchExportConfig, insertImport } from "./hh-config-transform"
import { confirmDiff } from "./prompt"

const MODULE = "@parity/hardhat-polkadot"
const PATCH = {
    networks: {
        hardhat: {
            polkavm: true,
            nodeConfig: {
                nodeBinaryPath: "./bin/substrate-node",
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
            localNode: {
                polkavm: true,
                url: `http://127.0.0.1:8545`,
            },
        },
    },
}

// Detect indentation format of a file
function detectIndent(src: string) {
    const m = src.match(/\n([ \t]+)"/)
    if (!m) return 2
    const ws = m[1]
    return ws.includes("\t") ? "\t" : ws.length
}

export async function portProject(projectPath: string, yesFlag: boolean) {
    try {
        const [pkgPath, packageJSONChanges, pkgChanged] = await updatePackageJSON(projectPath)
        const [HHConfigPath, HHConfigChanges, HHConfigChanged] = updateHHConfig(projectPath)
        if ((HHConfigChanged || pkgChanged) && (yesFlag || (await confirmDiff()))) {
            fs.writeFileSync(pkgPath, packageJSONChanges, "utf8")
            fs.writeFileSync(HHConfigPath, HHConfigChanges, "utf8")
        }
    } catch (e) {
        console.error(chalk.red("Error") + ": Failed to port project")
        console.error(e)
        process.exit(1)
    }
}

export async function updatePackageJSON(projectPath: string): Promise<[string, string, boolean]> {
    // Read `package.json` object & formatting metadata
    const pkgPath = path.join(projectPath, "package.json")
    const raw = fs.readFileSync(pkgPath, "utf8")
    const pkg = JSON.parse(raw)
    const indent = detectIndent(raw)

    // Fetch latest `@parity/hardhat-polkadot` module metadata from npm registry
    const m = (await (await fetch(`https://registry.npmjs.org/${MODULE}/latest`)).json()) as {
        version: string
        peerDependencies: { hardhat: string }
    }
    const polkadotHHVersion: string = m.version
    const requiredHHVersion: string = m.peerDependencies.hardhat.match(/(\d+)\.(\d+)\.(\d+)/)![0]

    // Update `hardhat` version if needed
    const HHLocation = pkg.dependencies?.hardhat ? "dependencies" : "devDependencies"
    const currentHHVersion = pkg[HHLocation]?.hardhat?.match(/(\d+)\.(\d+)\.(\d+)/)?.[0] || "0.0.0"
    if (currentHHVersion < requiredHHVersion) {
        pkg[HHLocation].hardhat = `^${requiredHHVersion}`
    }

    // Add `@parity/hardhat-polkadot` dev-dependency
    pkg.devDependencies["@parity/hardhat-polkadot"] = `^${polkadotHHVersion}`

    const newPkg = JSON.stringify(pkg, null, indent) + "\n"
    printDiff(pkgPath, raw, newPkg)
    return [pkgPath, newPkg, raw !== newPkg]
}

export function updateHHConfig(projectPath: string): [string, string, boolean] {
    // Read hardhat.config.* from disk
    const files = fs.readdirSync(projectPath)
    const configFile = files.find((file) => file.startsWith("hardhat.config."))!
    const HHCJsonFile = path.join(projectPath, configFile)

    // Apply transformations
    const j = jscodeshiftFactory.withParser("tsx")
    const root = j(fs.readFileSync(HHCJsonFile, "utf8"))
    insertImport(root, j, MODULE)
    patchExportConfig(root, j, PATCH)

    const prevHHConfig = fs.readFileSync(HHCJsonFile, "utf8")
    const newHHConfig = root.toSource()
    printDiff(HHCJsonFile, prevHHConfig, newHHConfig)
    return [HHCJsonFile, newHHConfig, prevHHConfig !== newHHConfig]
}

function printDiff(filePath: string, before: string, after: string) {
    if (before === after) {
        console.log(chalk.bold.yellow(`No changes in ${filePath}`))
        return
    }
    console.log(chalk.bold.hex("#ED3194")("Changes in"), chalk.bold(filePath))

    const tmpA = fs.mkdtempSync(path.join(os.tmpdir(), "jsc-a-"))
    const tmpB = fs.mkdtempSync(path.join(os.tmpdir(), "jsc-b-"))
    const A = path.join(tmpA, path.basename(filePath))
    const B = path.join(tmpB, path.basename(filePath))
    fs.writeFileSync(A, before)
    fs.writeFileSync(B, after)

    const { stdout } = spawnSync(
        "git",
        ["--no-pager", "diff", "--no-prefix", "--no-index", "--unified=0", "--color", "--", A, B],
        { encoding: "utf8" },
    )
    const lines = stdout.split(/\r?\n/)

    for (const l of lines.slice(4)) {
        if (l.startsWith("\\ No newline at end of file")) continue
        console.log(l)
    }

    fs.rmSync(tmpA, { recursive: true, force: true })
    fs.rmSync(tmpB, { recursive: true, force: true })
}
