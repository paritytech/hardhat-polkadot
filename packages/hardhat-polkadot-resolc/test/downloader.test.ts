import { describe, it, expect, vi } from "vitest"
import os from "os"

import { ResolcCompilerDownloader } from "../src/downloader.js"
import { CompilerPlatform, CompilerName } from "../src/types.js"

describe("ResolcCompilerDownloader", () => {
    describe("getCompilerPlatform", () => {
        it("returns a valid CompilerPlatform", () => {
            const platform = ResolcCompilerDownloader.getCompilerPlatform()
            expect(Object.values(CompilerPlatform)).toContain(platform)
        })
    })

    describe("getCompilerName", () => {
        it("returns a valid CompilerName", () => {
            const name = ResolcCompilerDownloader.getCompilerName()
            expect(Object.values(CompilerName)).toContain(name)
        })

        it("matches the current platform", () => {
            const name = ResolcCompilerDownloader.getCompilerName()
            const osPlatform = os.platform()

            if (osPlatform === "linux") expect(name).toBe(CompilerName.LINUX)
            else if (osPlatform === "darwin") expect(name).toBe(CompilerName.MACOS)
            else if (osPlatform === "win32") expect(name).toBe(CompilerName.WINDOWS)
            else expect(name).toBe(CompilerName.WASM)
        })
    })

    describe("getConcurrencySafeDownloader", () => {
        it("returns same instance for same platform+dir", () => {
            const a = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-a",
            )
            const b = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-a",
            )
            expect(a).toBe(b)
        })

        it("returns different instances for different dirs", () => {
            const a = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-b",
            )
            const b = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-c",
            )
            expect(a).not.toBe(b)
        })
    })
})
