import { describe, it, expect } from "vitest"
import { execSync } from "child_process"
import path from "path"
import fs from "fs"

const ROOT_DIR = path.resolve(__dirname, "../..")
const PACKAGES_DIR = path.join(ROOT_DIR, "packages")

describe("tarball validation", () => {
    const packages = ["hardhat-polkadot-resolc", "hardhat-polkadot-node", "hardhat-polkadot"]

    for (const pkg of packages) {
        it(`${pkg} tarball has no unsafe '../' paths`, () => {
            const pkgDir = path.join(PACKAGES_DIR, pkg)
            const tgzName = execSync("pnpm pack --silent", {
                cwd: pkgDir,
                encoding: "utf-8",
            }).trim()
            const tgzPath = path.join(pkgDir, tgzName)

            try {
                const listing = execSync(`tar -tzf "${tgzPath}"`, { encoding: "utf-8" })
                const unsafeEntries = listing.split("\n").filter((l) => l.includes(".."))
                expect(unsafeEntries).toEqual([])
            } finally {
                if (fs.existsSync(tgzPath)) fs.unlinkSync(tgzPath)
            }
        })

        it(`${pkg} tarball passes npm publish dry-run`, () => {
            const pkgDir = path.join(PACKAGES_DIR, pkg)
            const tgzName = execSync("pnpm pack --silent", {
                cwd: pkgDir,
                encoding: "utf-8",
            }).trim()
            const tgzPath = path.join(pkgDir, tgzName)

            try {
                expect(() =>
                    execSync(`npm publish "${tgzPath}" --dry-run`, { stdio: "pipe" }),
                ).not.toThrow()
            } finally {
                if (fs.existsSync(tgzPath)) fs.unlinkSync(tgzPath)
            }
        })
    }
}, { timeout: 120_000 })
