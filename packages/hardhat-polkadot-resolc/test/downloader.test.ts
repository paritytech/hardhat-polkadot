import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import os from "os"
import path from "path"
import fsExtra from "fs-extra"

import { ResolcCompilerDownloader } from "../src/downloader"
import { CompilerPlatform } from "hardhat/internal/solidity/compiler/downloader"
import { CompilerName } from "../src/types"

describe("ResolcCompilerDownloader", () => {
    describe("getCompilerPlatform", () => {
        it("returns a valid CompilerPlatform", () => {
            const platform = ResolcCompilerDownloader.getCompilerPlatform()
            expect([
                CompilerPlatform.LINUX,
                CompilerPlatform.MACOS,
                CompilerPlatform.WINDOWS,
                CompilerPlatform.WASM,
            ]).toContain(platform)
        })
    })

    describe("getCompilerName", () => {
        it("returns a valid CompilerName", () => {
            const name = ResolcCompilerDownloader.getCompilerName()
            expect([
                CompilerName.LINUX,
                CompilerName.MACOS,
                CompilerName.WINDOWS,
                CompilerName.WASM,
            ]).toContain(name)
        })

        it("matches platform to name consistently", () => {
            const platform = ResolcCompilerDownloader.getCompilerPlatform()
            const name = ResolcCompilerDownloader.getCompilerName()

            if (platform === CompilerPlatform.LINUX) {
                expect(name).toBe(CompilerName.LINUX)
            } else if (platform === CompilerPlatform.MACOS) {
                expect(name).toBe(CompilerName.MACOS)
            } else if (platform === CompilerPlatform.WINDOWS) {
                expect(name).toBe(CompilerName.WINDOWS)
            } else {
                expect(name).toBe(CompilerName.WASM)
            }
        })
    })

    describe("getConcurrencySafeDownloader", () => {
        it("returns the same instance for the same platform and dir", () => {
            const a = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-compilers-a",
            )
            const b = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-compilers-a",
            )
            expect(a).toBe(b)
        })

        it("returns different instances for different platforms", () => {
            const a = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-compilers-b",
            )
            const b = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.MACOS,
                "/tmp/test-compilers-b",
            )
            expect(a).not.toBe(b)
        })

        it("returns different instances for different directories", () => {
            const a = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-compilers-c",
            )
            const b = ResolcCompilerDownloader.getConcurrencySafeDownloader(
                CompilerPlatform.LINUX,
                "/tmp/test-compilers-d",
            )
            expect(a).not.toBe(b)
        })
    })

    describe("isCompilerDownloaded", () => {
        let tmpDir: string

        beforeEach(async () => {
            tmpDir = await fsExtra.mkdtemp(path.join(os.tmpdir(), "resolc-test-"))
        })

        afterEach(async () => {
            await fsExtra.remove(tmpDir)
        })

        it("returns false when no compiler list exists", async () => {
            const downloader = new ResolcCompilerDownloader(CompilerPlatform.LINUX, tmpDir)
            const result = await downloader.isCompilerDownloaded("0.6.0")
            expect(result).toBe(false)
        })

        it("returns false when version not in list", async () => {
            const listDir = path.join(tmpDir, CompilerPlatform.LINUX)
            await fsExtra.ensureDir(listDir)
            await fsExtra.writeJSON(path.join(listDir, "resolc-list.json"), {
                builds: [
                    {
                        name: CompilerName.LINUX,
                        path: "resolc-0.5.0",
                        version: "0.5.0",
                        build: "abc123",
                        longVersion: "0.5.0+commit.abc123",
                        sha256: "deadbeef",
                        platform: CompilerPlatform.LINUX,
                    },
                ],
                releases: {},
                latestRelease: "v0.5.0",
            })

            const downloader = new ResolcCompilerDownloader(CompilerPlatform.LINUX, tmpDir)
            const result = await downloader.isCompilerDownloaded("0.6.0")
            expect(result).toBe(false)
        })

        it("returns false when version in list but binary not on disk", async () => {
            const listDir = path.join(tmpDir, CompilerPlatform.LINUX)
            await fsExtra.ensureDir(listDir)
            await fsExtra.writeJSON(path.join(listDir, "resolc-list.json"), {
                builds: [
                    {
                        name: CompilerName.LINUX,
                        path: "resolc-0.6.0",
                        version: "0.6.0",
                        build: "abc123",
                        longVersion: "0.6.0+commit.abc123",
                        sha256: "deadbeef",
                        platform: CompilerPlatform.LINUX,
                    },
                ],
                releases: {},
                latestRelease: "v0.6.0",
            })

            const downloader = new ResolcCompilerDownloader(CompilerPlatform.LINUX, tmpDir)
            const result = await downloader.isCompilerDownloaded("0.6.0")
            expect(result).toBe(false)
        })

        it("returns true when version in list and binary exists on disk", async () => {
            const listDir = path.join(tmpDir, CompilerPlatform.LINUX)
            await fsExtra.ensureDir(listDir)
            await fsExtra.writeJSON(path.join(listDir, "resolc-list.json"), {
                builds: [
                    {
                        name: CompilerName.LINUX,
                        path: "resolc-0.6.0",
                        version: "0.6.0",
                        build: "abc123",
                        longVersion: "0.6.0+commit.abc123",
                        sha256: "deadbeef",
                        platform: CompilerPlatform.LINUX,
                    },
                ],
                releases: {},
                latestRelease: "v0.6.0",
            })
            // Create the binary file
            await fsExtra.writeFile(path.join(listDir, "resolc-0.6.0"), "fake binary")

            const downloader = new ResolcCompilerDownloader(CompilerPlatform.LINUX, tmpDir)
            const result = await downloader.isCompilerDownloaded("0.6.0")
            expect(result).toBe(true)
        })
    })

    describe("getCompiler", () => {
        let tmpDir: string

        beforeEach(async () => {
            tmpDir = await fsExtra.mkdtemp(path.join(os.tmpdir(), "resolc-test-"))
        })

        afterEach(async () => {
            await fsExtra.remove(tmpDir)
        })

        it("returns compiler info when binary exists and works", async () => {
            const listDir = path.join(tmpDir, CompilerPlatform.LINUX)
            await fsExtra.ensureDir(listDir)

            const build = {
                name: CompilerName.LINUX,
                path: "resolc-0.6.0",
                version: "0.6.0",
                build: "abc123",
                longVersion: "0.6.0+commit.abc123",
                sha256: "deadbeef",
                platform: CompilerPlatform.LINUX,
            }
            await fsExtra.writeJSON(path.join(listDir, "resolc-list.json"), {
                builds: [build],
                releases: {},
                latestRelease: "v0.6.0",
            })
            await fsExtra.writeFile(path.join(listDir, "resolc-0.6.0"), "fake binary")

            const downloader = new ResolcCompilerDownloader(CompilerPlatform.LINUX, tmpDir)
            const compiler = await downloader.getCompiler("0.6.0")
            expect(compiler).toBeDefined()
            expect(compiler!.version).toBe("0.6.0")
            expect(compiler!.resolcPath).toBe(path.join(listDir, "resolc-0.6.0"))
            expect(compiler!.isJs).toBe(false)
        })

        it("returns undefined when .does.not.work file exists", async () => {
            const listDir = path.join(tmpDir, CompilerPlatform.LINUX)
            await fsExtra.ensureDir(listDir)

            const build = {
                name: CompilerName.LINUX,
                path: "resolc-0.6.0",
                version: "0.6.0",
                build: "abc123",
                longVersion: "0.6.0+commit.abc123",
                sha256: "deadbeef",
                platform: CompilerPlatform.LINUX,
            }
            await fsExtra.writeJSON(path.join(listDir, "resolc-list.json"), {
                builds: [build],
                releases: {},
                latestRelease: "v0.6.0",
            })
            await fsExtra.writeFile(path.join(listDir, "resolc-0.6.0"), "fake binary")
            await fsExtra.writeFile(path.join(listDir, "resolc-0.6.0.does.not.work"), "")

            const downloader = new ResolcCompilerDownloader(CompilerPlatform.LINUX, tmpDir)
            const compiler = await downloader.getCompiler("0.6.0")
            expect(compiler).toBeUndefined()
        })

        it("sets isJs to true for WASM platform", async () => {
            const listDir = path.join(tmpDir, CompilerPlatform.WASM)
            await fsExtra.ensureDir(listDir)

            const build = {
                name: CompilerName.WASM,
                path: "resolc.wasm",
                version: "0.6.0",
                build: "abc123",
                longVersion: "0.6.0+commit.abc123",
                sha256: "deadbeef",
                platform: CompilerPlatform.WASM,
            }
            await fsExtra.writeJSON(path.join(listDir, "resolc-list.json"), {
                builds: [build],
                releases: {},
                latestRelease: "v0.6.0",
            })
            await fsExtra.writeFile(path.join(listDir, "resolc.wasm"), "fake wasm")

            const downloader = new ResolcCompilerDownloader(CompilerPlatform.WASM, tmpDir)
            const compiler = await downloader.getCompiler("0.6.0")
            expect(compiler).toBeDefined()
            expect(compiler!.isJs).toBe(true)
        })
    })

    describe("version validation", () => {
        let tmpDir: string

        beforeEach(async () => {
            tmpDir = await fsExtra.mkdtemp(path.join(os.tmpdir(), "resolc-test-"))
            const listDir = path.join(tmpDir, CompilerPlatform.LINUX)
            await fsExtra.ensureDir(listDir)
            await fsExtra.writeJSON(path.join(listDir, "resolc-list.json"), {
                builds: [],
                releases: {},
                latestRelease: "v0.6.0",
            })
        })

        afterEach(async () => {
            await fsExtra.remove(tmpDir)
        })

        it("throws for non-numeric version strings", async () => {
            const downloader = new ResolcCompilerDownloader(CompilerPlatform.LINUX, tmpDir)
            await expect(downloader.isCompilerDownloaded("abc")).rejects.toThrow(
                "is not a valid version",
            )
        })
    })
})
