import { describe, it, expect, afterEach } from "vitest"
import fs from "fs"
import path from "path"
import { createTestProject, TestProject } from "./helpers"

describe("CLI port command", { timeout: 120_000 }, () => {
    let project: TestProject

    afterEach(() => {
        project?.cleanup()
    })

    it("ports a TypeScript project (scenario-1)", () => {
        project = createTestProject("test-port-command/scenario-1")

        const configBefore = safeRead(project.dir, "hardhat.config.ts")
        const pkgBefore = safeRead(project.dir, "package.json")

        project.exec("npx hardhat-polkadot port . -y")

        const configAfter = safeRead(project.dir, "hardhat.config.ts")
        const pkgAfter = safeRead(project.dir, "package.json")

        expect(configAfter).not.toBe(configBefore)
        expect(pkgAfter).not.toBe(pkgBefore)
    })

    it("ports a JavaScript project (scenario-2)", () => {
        project = createTestProject("test-port-command/scenario-2")

        const configBefore = safeRead(project.dir, "hardhat.config.js")
        const pkgBefore = safeRead(project.dir, "package.json")

        project.exec("npx hardhat-polkadot port . -y")

        const configAfter = safeRead(project.dir, "hardhat.config.js")
        const pkgAfter = safeRead(project.dir, "package.json")

        expect(configAfter).not.toBe(configBefore)
        expect(pkgAfter).not.toBe(pkgBefore)
    })
})

function safeRead(dir: string, file: string): string {
    const fullPath = path.join(dir, file)
    try {
        return fs.readFileSync(fullPath, "utf-8")
    } catch {
        return ""
    }
}
