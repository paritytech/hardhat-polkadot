import fs from "fs"
import path from "path"
import jscodeshiftFactory from "jscodeshift"
import { coerce, minVersion, lt } from "semver"

import {
    patchExportConfig,
    insertImport,
    addPluginsArray,
    wrapWithDefineConfig,
    renameHardhatNetwork,
    updateDefaultNetworkProperty,
} from "./hh-config-transform.js"

const MODULE = "@parity/hardhat-polkadot"
const PATCH = {
    networks: {
        default: {
            polkadot: true,
            nodeConfig: {
                nodeBinaryPath: "./bin/anvil-polkadot",
            },
        },
    },
}

/**
 * Detect indentation format of a file
 */
function detectIndent(src: string) {
    const m = src.match(/\n([ \t]+)"/)
    if (!m) return 2
    const ws = m[1]
    return ws.includes("\t") ? "\t" : ws.length
}

/**
 * Generates `package.json` migration changes for PVM compatibility
 */
export async function updatePackageJSON(projectPath: string): Promise<[string, string, string]> {
    // Read `package.json` object & formatting metadata
    // We allow "File not found" errors to bubble up
    const pkgPath = path.join(projectPath, "package.json")
    const raw = fs.readFileSync(pkgPath, "utf8")
    const pkg = JSON.parse(raw)
    const indent = detectIndent(raw)

    // Fetch latest `@parity/hardhat-polkadot` module metadata from npm registry
    // We allow "Fetch failed" error to bubble up, or throw a custom error in case
    // of a successful but invalid response
    const response = await fetch(`https://registry.npmjs.org/${MODULE}/latest`)
    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${MODULE} metadata from npm registry (HTTP ${response.status})`,
        )
    }
    const moduleMetadata = (await response.json()) as {
        version: string
        peerDependencies: { hardhat: string }
    }
    if (!moduleMetadata.version || !moduleMetadata.peerDependencies) {
        throw new Error(`Something went wrong fetching ${MODULE} metadata from the npm registry`)
    }

    const polkadotHHVersion: string = moduleMetadata.version

    // Ensure hardhat@^3.0.0 is present (required by this plugin)
    const HH_MIN_VERSION = "3.0.0"
    const HHLocation = pkg.dependencies?.hardhat ? "dependencies" : "devDependencies"
    const currentHHVersion = coerce(pkg[HHLocation]?.hardhat ?? "0.0.0") ?? minVersion("0.0.0")!
    pkg[HHLocation] ??= {}
    if (lt(currentHHVersion, HH_MIN_VERSION)) {
        pkg[HHLocation].hardhat = `^${HH_MIN_VERSION}`
    }

    // Add `@parity/hardhat-polkadot` dev-dependency
    pkg.devDependencies ??= {}
    pkg.devDependencies["@parity/hardhat-polkadot"] = `^${polkadotHHVersion}`

    const newPkg = JSON.stringify(pkg, null, indent) + "\n"
    return [pkgPath, newPkg, raw]
}

/**
 * Generates `hardhat.config.*` migration changes for PVM compatibility
 */
export function updateHHConfig(projectPath: string): [string, string, string] {
    // Read hardhat.config.* from disk
    const files = fs.readdirSync(projectPath)
    const configFile = files.find((file) => file.startsWith("hardhat.config."))
    if (!configFile) {
        throw new Error(`No hardhat.config.* file found in ${projectPath}`)
    }
    const HHCJsonFile = path.join(projectPath, configFile)

    // Apply transformations
    const j = jscodeshiftFactory.withParser("tsx")
    const prevHHConfig = fs.readFileSync(HHCJsonFile, "utf8")
    const root = j(prevHHConfig)
    renameHardhatNetwork(root, j)
    updateDefaultNetworkProperty(root, j)
    insertImport(root, j, MODULE)
    patchExportConfig(root, j, PATCH)
    addPluginsArray(root, j, "polkadot")
    wrapWithDefineConfig(root, j)

    const newHHConfig = root.toSource()
    return [HHCJsonFile, newHHConfig, prevHHConfig]
}
