import fs from "fs"
import path from "path"

const MIN_HARDHAT = "2.26.0" // TODO! don't hardcode this (get from peer dependency spec)

// Detect indentation format of json file
function detectIndent(src: string) {
    const m = src.match(/\n([ \t]+)"/)
    if (!m) return 2
    const ws = m[1]
    return ws.includes("\t") ? "\t" : ws.length
}

export function portProject(projectPath: string) {
    // Fetch `package.json` object & formatting metadata
    const pkgPath = path.join(projectPath, "package.json")
    const raw = fs.readFileSync(pkgPath, "utf8")
    const pkg = JSON.parse(raw) as any
    const indent = detectIndent(raw)

    // Ensure compatible `hardhat` version
    const hardhatVersion = pkg.devDependencies.hardhat.match(/(\d+)\.(\d+)\.(\d+)/)[0]
    console.log(hardhatVersion)
    if (hardhatVersion < MIN_HARDHAT) {
        console.log("updating `hardhat` version to comply with `@parity/hardhat-polkadot`")
        pkg.devDependencies.hardhat = `^${MIN_HARDHAT}`
    }

    // Add `@parity/hardhat-polkadot` dependency
    pkg.devDependencies["@parity/hardhat-polkadot"] = "^0.1.9" // TODO! get from package.json version
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + "\n", "utf8")

    // TODO! Update `hardhat.config.*`
}
