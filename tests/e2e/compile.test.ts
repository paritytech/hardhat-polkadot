import { describe, it, expect, afterEach } from "vitest"
import { createTestProject, TestProject } from "./helpers"

describe("compilation", { timeout: 120_000 }, () => {
    let project: TestProject

    afterEach(() => {
        project?.cleanup()
    })

    it("compiles a basic solidity contract", () => {
        project = createTestProject("foo", "multiple-compile.config.js")

        project.exec("npx hardhat build --show-stack-traces")

        expect(project.exists("artifacts")).toBe(true)
        expect(project.exists("cache")).toBe(true)
        expect(project.isNonEmpty("artifacts")).toBe(true)
        expect(project.isNonEmpty("cache")).toBe(true)
    })

    it("compiles with multiple solidity versions", () => {
        project = createTestProject("foo", "multiple-compile.config.js")

        project.exec("npx hardhat build --show-stack-traces")

        expect(project.isNonEmpty("artifacts")).toBe(true)
        expect(project.isNonEmpty("cache")).toBe(true)
    })
})
