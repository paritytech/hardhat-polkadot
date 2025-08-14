import fs from "fs"
import path from "path"
import jscodeshiftFactory from "jscodeshift"
import { patchExportConfig, insertImport } from "./hh-config-transform"

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
} as const

// Detect indentation format of a file
function detectIndent(src: string) {
    const m = src.match(/\n([ \t]+)"/)
    if (!m) return 2
    const ws = m[1]
    return ws.includes("\t") ? "\t" : ws.length
}

export async function updatePackageJSON(projectPath: string) {
    // Read `package.json` object & formatting metadata
    const pkgPath = path.join(projectPath, "package.json")
    const raw = fs.readFileSync(pkgPath, "utf8")
    const pkg = JSON.parse(raw) as any
    const indent = detectIndent(raw)

    // Fetch latest `@parity/hardhat-polkadot` module metadata from npm registry
    const m = (await (await fetch(`https://registry.npmjs.org/${MODULE}/latest`)).json()) as any
    const polkadotHHVersion: string = m.version
    const requiredHHVersion: string = m.peerDependencies?.hardhat!.match(/(\d+)\.(\d+)\.(\d+)/)[0]

    // Update `hardhat` version if needed
    const HHLocation = pkg.dependencies.hardhat ? "dependencies" : "devDependencies"
    const currentHHVersion = pkg[HHLocation]?.hardhat?.match(/(\d+)\.(\d+)\.(\d+)/)?.[0] || "0.0.0"
    if (currentHHVersion < requiredHHVersion) {
        console.log("updating `hardhat` version to comply with `@parity/hardhat-polkadot`")
        pkg[HHLocation].hardhat = `^${requiredHHVersion}`
    }

    // Add `@parity/hardhat-polkadot` dev-dependency
    pkg.devDependencies["@parity/hardhat-polkadot"] = `^${polkadotHHVersion}`

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + "\n", "utf8")
}

export function updateHHConfig(projectPath: string) {
    // Read hardhat.config.* from disk
    const files = fs.readdirSync(projectPath)
    const configFile = files.find((file) => file.startsWith("hardhat.config."))!
    const HHCJsonFile = path.join(projectPath, configFile)

    // Apply transformations
    const j = jscodeshiftFactory.withParser("tsx")
    const root = j(fs.readFileSync(HHCJsonFile, "utf8"))
    insertImport(root, j, MODULE)
    patchExportConfig(root, j, PATCH)

    fs.writeFileSync(HHCJsonFile, root.toSource(), "utf8")
}
