import fs from "fs"
import path from "path"
import type { API, FileInfo, Program } from "jscodeshift"
import jscodeshiftFactory from "jscodeshift"
import t from "./hh-config-transform"
const j = (jscodeshiftFactory as any).withParser("tsx") // parse JS/TS/TSX

const MIN_HARDHAT = "2.26.0" // TODO! don't hardcode this (get from peer dependency spec)

// Detect indentation format of a file
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
    // Find hardhat.config.* file
    const files = fs.readdirSync(projectPath)
    const configFile = files.find((file) => file.startsWith("hardhat.config."))
    if (!configFile) {
        console.log("No hardhat.config.* file found in the project")
        return
    }
    const configFilePath = path.join(projectPath, configFile)
    const fileInfo: FileInfo = {
        path: configFilePath,
        source: fs.readFileSync(configFilePath, "utf8"),
    }
    const jscodeshiftAPI: API = {
        jscodeshift: j,
        j,
        stats: () => {}, // no-op counters
        report: () => {}, // no-op logger
        printOptions: { quote: "single" }, // passed to recast
    } as unknown as API
    transformHHConfig(fileInfo, jscodeshiftAPI, {})

    const fileInfo2: FileInfo = {
        path: configFilePath,
        source: fs.readFileSync(configFilePath, "utf8"),
    }
    t(fileInfo2, jscodeshiftAPI, {})
}

const MODULE = "@parity/hardhat-polkadot"
function transformHHConfig(file: FileInfo, api: API, options: any) {
    const j = api.jscodeshift
    const root = j(file.source)
    const program: Program = root.get().node.program
    const isESM = root.find(j.ImportDeclaration).size() > 0

    const esmImport = { source: { value: MODULE } }
    const cjsImport = {
        callee: { type: "Identifier" as const, name: "require" as const },
        arguments: [{ type: "StringLiteral" as const, value: MODULE }],
    }

    if (
        root.find(j.ImportDeclaration, esmImport).length +
            root.find(j.CallExpression, cjsImport).length ==
        0
    ) {
        const stmt = isESM
            ? j.importDeclaration([], j.stringLiteral(MODULE))
            : j.expressionStatement(
                  j.callExpression(j.identifier("require"), [j.stringLiteral(MODULE)]),
              )
        program.body.splice(0, 0, stmt)
    } else {
        console.log("some found")
    }

    root.find(j.ExportDefaultDeclaration, { declaration: { type: "ObjectExpression" } }).forEach(
        (p) => console.log(p),
    )

    fs.writeFileSync(file.path, root.toSource(), "utf8")

    return root.toSource() // recast preserves style/comments
}
