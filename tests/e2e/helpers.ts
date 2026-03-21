import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"

const ROOT_DIR = path.resolve(__dirname, "../..")
const FIXTURE_DIR = path.resolve(__dirname, "../fixture-projects")
const PACKAGES_DIR = path.join(ROOT_DIR, "packages")

// Workspace packages to pack and install (order matters: deps first)
const WORKSPACE_PACKAGES = [
    "hardhat-polkadot-migrator",
    "hardhat-polkadot-resolc",
    "hardhat-polkadot-node",
    "hardhat-polkadot",
]

let cachedTgzPaths: string[] | undefined

/**
 * Build and pack all workspace packages once, returning paths to the .tgz files.
 */
function getPluginTarballs(): string[] {
    if (cachedTgzPaths) return cachedTgzPaths

    // Build all packages (includes clean)
    execSync("pnpm run build", { cwd: ROOT_DIR, stdio: "pipe" })

    // Pack each workspace package individually
    cachedTgzPaths = WORKSPACE_PACKAGES.map((pkg) => {
        const pkgDir = path.join(PACKAGES_DIR, pkg)

        // Remove any existing tarballs
        for (const f of fs.readdirSync(pkgDir)) {
            if (f.endsWith(".tgz")) fs.unlinkSync(path.join(pkgDir, f))
        }

        const tgzName = execSync("pnpm pack", {
            cwd: pkgDir,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
        })
            .trim()
            .split("\n")
            .pop()!
            .trim()

        return path.join(pkgDir, tgzName)
    })

    return cachedTgzPaths
}

export interface TestProject {
    dir: string
    exec: (cmd: string, opts?: { env?: Record<string, string> }) => string
    exists: (relativePath: string) => boolean
    isNonEmpty: (relativePath: string) => boolean
    cleanup: () => void
}

/**
 * Create a temporary test project from a fixture, with all plugin packages installed.
 */
export function createTestProject(fixtureName: string, configFile?: string): TestProject {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hh-polkadot-test-"))

    // Copy fixture contents
    const fixtureDir = path.join(FIXTURE_DIR, fixtureName)
    fs.cpSync(fixtureDir, tmpDir, { recursive: true })

    // Copy config file if specified
    if (configFile) {
        const configSrc = path.join(FIXTURE_DIR, configFile)
        fs.copyFileSync(configSrc, path.join(tmpDir, "hardhat.config.js"))
    }

    const execOpts: ExecSyncOptionsWithStringEncoding = {
        cwd: tmpDir,
        encoding: "utf-8",
        stdio: "pipe",
        env: {
            ...process.env,
            npm_config_fund: "false",
            npm_config_audit: "false",
            npm_config_legacy_peer_deps: "true",
        },
    }

    // Install all workspace tarballs
    const tgzPaths = getPluginTarballs()
    for (const tgzPath of tgzPaths) {
        execSync(`npm add "${tgzPath}"`, execOpts)
    }
    execSync("npm install", execOpts)

    return {
        dir: tmpDir,
        exec(cmd: string, opts?: { env?: Record<string, string> }) {
            return execSync(cmd, {
                ...execOpts,
                env: { ...execOpts.env, ...opts?.env, FORCE_COLOR: "0" },
            })
        },
        exists(relativePath: string) {
            return fs.existsSync(path.join(tmpDir, relativePath))
        },
        isNonEmpty(relativePath: string) {
            const fullPath = path.join(tmpDir, relativePath)
            if (!fs.existsSync(fullPath)) return false
            return fs.readdirSync(fullPath).length > 0
        },
        cleanup() {
            fs.rmSync(tmpDir, { recursive: true, force: true })
        },
    }
}
