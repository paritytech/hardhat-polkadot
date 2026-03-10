import { describe, it, expect } from "vitest"

import { CompilerName } from "../src/types"

describe("CompilerName enum", () => {
    it("defines LINUX name", () => {
        expect(CompilerName.LINUX).toBe("resolc-x86_64-unknown-linux-musl")
    })

    it("defines WINDOWS name with .exe extension", () => {
        expect(CompilerName.WINDOWS).toMatch(/\.exe$/)
    })

    it("defines MACOS name with universal prefix", () => {
        expect(CompilerName.MACOS).toContain("universal-apple-darwin")
    })

    it("defines WASM name with .wasm extension", () => {
        expect(CompilerName.WASM).toMatch(/\.wasm$/)
    })
})
