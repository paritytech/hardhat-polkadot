import { execSync, ExecSyncOptionsWithStringEncoding } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"

const ROOT_DIR = path.resolve(__dirname, "../..")
const FIXTURE_DIR = path.resolve(__dirname, "../fixture-projects")

let cachedTgzPath: string | undefined

/**
 * Build and pack the umbrella plugin once, returning the path to the .tgz.
 * Cached across calls within the same process.
 */
export function getPluginTarball(): string {
    if (cachedTgzPath && fs.existsSync(cachedTgzPath)) return cachedTgzPath

    // Build all packages
    execSync("pnpm run build", { cwd: ROOT_DIR, stdio: "pipe" })

    // Pack the umbrella package
    const packOutput = execSync("pnpm pack --silent", {
        cwd: path.join(ROOT_DIR, "packages/hardhat-polkadot"),
        encoding: "utf-8",
    }).trim()

    // The output is the filename of the tarball
    const tgzName = packOutput.split("\n").pop()!.trim()
    cachedTgzPath = path.join(ROOT_DIR, "packages/hardhat-polkadot", tgzName)

    if (!fs.existsSync(cachedTgzPath)) {
        throw new Error(`Tarball not found at ${cachedTgzPath}`)
    }

    return cachedTgzPath
}

export interface TestProject {
    /** Absolute path to the temp project directory */
    dir: string
    /** Run a shell command inside the project directory */
    exec: (cmd: string, opts?: { env?: Record<string, string> }) => string
    /** Check if a file or directory exists in the project */
    exists: (relativePath: string) => boolean
    /** Check if a directory is non-empty */
    isNonEmpty: (relativePath: string) => boolean
    /** Clean up the temp directory */
    cleanup: () => void
}

/**
 * Create a temporary test project from a fixture, with the plugin installed.
 *
 * @param fixtureName - Name of the fixture directory under tests/fixture-projects/
 * @param configFile  - Optional config file to copy as hardhat.config.js
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

    // Install the plugin tarball
    const tgzPath = getPluginTarball()
    const execOpts: ExecSyncOptionsWithStringEncoding = {
        cwd: tmpDir,
        encoding: "utf-8",
        stdio: "pipe",
        env: { ...process.env, npm_config_fund: "false", npm_config_audit: "false" },
    }

    execSync(`npm add "${tgzPath}"`, execOpts)
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
