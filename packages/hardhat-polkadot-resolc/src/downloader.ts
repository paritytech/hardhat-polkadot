/* eslint-disable @typescript-eslint/no-explicit-any */
import path from "path"
import fsExtra from "fs-extra"
import debug from "debug"
import os from "os"
import { execFile } from "child_process"
import { assertHardhatInvariant } from "hardhat/internal/core/errors"
import { MultiProcessMutex } from "hardhat/internal/util/multi-process-mutex"
import {
    CompilerPlatform,
    ICompilerDownloader,
} from "hardhat/internal/solidity/compiler/downloader"
import { listAttributesSync, removeAttributeSync } from "fs-xattr"
import { download } from "./download"
import { CompilerName, type ResolcCompiler, type CompilerBuild, type CompilerList } from "./types"
import { ResolcPluginError } from "./errors"
import { COMPILER_REPOSITORY_API_URL, COMPILER_REPOSITORY_URL } from "./constants"

const log = debug("hardhat:core:resolc:downloader")

export interface IResolcCompilerDownloader extends Omit<ICompilerDownloader, "getCompiler"> {
    getCompiler(version: string): Promise<ResolcCompiler | undefined>
}

export class ResolcCompilerDownloader implements IResolcCompilerDownloader {
    public static getCompilerPlatform(): CompilerPlatform {
        switch (os.platform()) {
            case "win32":
                return CompilerPlatform.WINDOWS
            case "linux":
                return CompilerPlatform.LINUX
            case "darwin":
                return CompilerPlatform.MACOS
            default:
                return CompilerPlatform.WASM
        }
    }

    public static getCompilerName(): CompilerName {
        switch (os.platform()) {
            case "win32":
                return CompilerName.WINDOWS
            case "linux":
                return CompilerName.LINUX
            case "darwin":
                return CompilerName.MACOS
            default:
                return CompilerName.WASM
        }
    }

    private static _downloaderPerPlatform: Map<string, ResolcCompilerDownloader> = new Map()

    public static getConcurrencySafeDownloader(platform: CompilerPlatform, compilersDir: string) {
        const key = platform + compilersDir

        if (!this._downloaderPerPlatform.has(key)) {
            this._downloaderPerPlatform.set(
                key,
                new ResolcCompilerDownloader(platform, compilersDir),
            )
        }

        return this._downloaderPerPlatform.get(key)!
    }

    public static defaultCompilerListCachePeriod = 3_600_00
    private readonly _mutex = new MultiProcessMutex("compiler-download")

    constructor(
        private readonly _platform: CompilerPlatform,
        private readonly _compilersDir: string,
        private readonly _compilerListCachePeriodMs = ResolcCompilerDownloader.defaultCompilerListCachePeriod,
        private readonly _downloadFunction: typeof download = download,
    ) {}

    public async isCompilerDownloaded(version: string): Promise<boolean> {
        const build = await this._getCompilerBuild(version)

        if (build === undefined) {
            return false
        }

        const downloadPath = this._getCompilerBinaryPathFromBuild(build)

        return fsExtra.pathExists(downloadPath)
    }

    public async downloadCompiler(
        version: string,
        downloadStartedCb: (isCompilerDownloaded: boolean) => Promise<any>,
        downloadEndedCb: (isCompilerDownloaded: boolean) => Promise<any>,
    ): Promise<void> {
        await this._mutex.use(async () => {
            const isCompilerDownloaded = await this.isCompilerDownloaded(version)

            if (isCompilerDownloaded === true) {
                return
            }

            await downloadStartedCb(isCompilerDownloaded)

            let build = await this._getCompilerBuild(version)

            if (build === undefined && (await this._shouldDownloadCompilerList())) {
                try {
                    await this._downloadCompilerList()
                } catch (_e: any) {
                    throw new ResolcPluginError(
                        `Resolc version ${version} is invalid or hasn't been released yet`,
                    )
                }

                build = await this._getCompilerBuild(version)
            }

            if (build === undefined) {
                throw new ResolcPluginError(
                    `Resolc version ${version} is invalid or hasn't been released yet`,
                )
            }

            let downloadPath: string
            try {
                downloadPath = await this._downloadCompiler(build)
            } catch (_e: any) {
                throw new ResolcPluginError(
                    `Couldn't download compiler version ${build.longVersion}. Please check your internet connection and try again.`,
                )
            }

            const verified = await this._verifyCompilerDownload(build, downloadPath)
            if (!verified) {
                throw new ResolcPluginError(
                    `Couldn't download compiler version ${build.longVersion}: Checksum verification failed.`,
                )
            }

            await this._postProcessCompilerDownload(build, downloadPath)

            await downloadEndedCb(isCompilerDownloaded)
        })
    }

    public async getCompiler(version: string): Promise<ResolcCompiler | undefined> {
        const build = await this._getCompilerBuild(version)

        assertHardhatInvariant(
            build !== undefined,
            "Trying to get a compiler before it was downloaded",
        )

        const resolcPath = this._getCompilerBinaryPathFromBuild(build)

        assertHardhatInvariant(
            await fsExtra.pathExists(resolcPath),
            "Trying to get a compiler before it was downloaded",
        )

        if (await fsExtra.pathExists(this._getCompilerDoesntWorkFile(build))) {
            return undefined
        }

        return {
            version,
            longVersion: build.longVersion,
            resolcPath,
            isJs: this._platform === CompilerPlatform.WASM,
        }
    }

    private async _downloadCompilerList(): Promise<void> {
        const url = COMPILER_REPOSITORY_API_URL
        const downloadPath = this._getCompilerListPath()
        const name = ResolcCompilerDownloader.getCompilerName()
        const platform = ResolcCompilerDownloader.getCompilerPlatform()

        await this._downloadFunction(url, downloadPath, name, platform, true)
    }

    private _getCompilerListPath(): string {
        return path.join(this._compilersDir, this._platform, "resolc-list.json")
    }

    private async _shouldDownloadCompilerList(): Promise<boolean> {
        const listPath = this._getCompilerListPath()
        if (!(await fsExtra.pathExists(listPath))) {
            return true
        }

        const stats = await fsExtra.stat(listPath)
        const age = new Date().valueOf() - stats.ctimeMs

        return age > this._compilerListCachePeriodMs
    }

    private async _getCompilerBuild(version: string): Promise<CompilerBuild | undefined> {
        const listPath = this._getCompilerListPath()
        if (!(await fsExtra.pathExists(listPath))) {
            return undefined
        }

        const list = await this._readCompilerList(listPath)
        if (Number.isNaN(parseInt(version))) {
            throw new ResolcPluginError(`${version} is not a valid version.`)
        }

        return list.builds.find((b) => b.version === version)
    }

    private async _readCompilerList(listPath: string): Promise<CompilerList> {
        return fsExtra.readJSON(listPath)
    }

    private _getCompilerDownloadPathFromBuild(build: CompilerBuild): string {
        return path.join(this._compilersDir, this._platform, build.path)
    }

    private _getCompilerBinaryPathFromBuild(build: CompilerBuild): string {
        const downloadPath = this._getCompilerDownloadPathFromBuild(build)

        if (this._platform !== CompilerPlatform.WINDOWS || !downloadPath.endsWith(".zip")) {
            return downloadPath
        }
        return path.join(this._compilersDir, build.version, "resolc-x86_64-pc-windows-msvc.exe")
    }

    private _getCompilerDoesntWorkFile(build: CompilerBuild): string {
        return `${this._getCompilerBinaryPathFromBuild(build)}.does.not.work`
    }

    private async _downloadCompiler(build: CompilerBuild): Promise<string> {
        log(`Downloading resolc compiler ${build.longVersion}`)
        const url = `${COMPILER_REPOSITORY_URL}v${build.version}/${build.name}`
        const downloadPath = this._getCompilerDownloadPathFromBuild(build)
        const name = ResolcCompilerDownloader.getCompilerName()
        const platform = ResolcCompilerDownloader.getCompilerPlatform()

        await this._downloadFunction(url, downloadPath, name, platform)

        return downloadPath
    }

    private async _verifyCompilerDownload(
        build: CompilerBuild,
        downloadPath: string,
    ): Promise<boolean> {
        const { sha256 } = await import("./utils")

        const expectedSha256 = build.sha256
        const compiler = await fsExtra.readFile(downloadPath)

        const compilerSha256 = sha256(compiler)

        if (expectedSha256 !== compilerSha256) {
            await fsExtra.unlink(downloadPath)
            return false
        }

        return true
    }

    private async _postProcessCompilerDownload(
        build: CompilerBuild,
        downloadPath: string,
    ): Promise<void> {
        if (this._platform === CompilerPlatform.WASM) {
            return
        }

        if (this._platform === CompilerPlatform.LINUX) {
            fsExtra.chmodSync(downloadPath, 0o755)
        } else if (this._platform === CompilerPlatform.MACOS) {
            const attributes = listAttributesSync(downloadPath)
            for (const attr of attributes) {
                removeAttributeSync(downloadPath, attr)
            }
            fsExtra.chmodSync(downloadPath, 0o755)
        }

        log("Checking native resolc binary")
        const nativeResolcWorks = await this._checkNativeResolc(build)

        if (nativeResolcWorks) {
            return
        }

        await fsExtra.createFile(this._getCompilerDoesntWorkFile(build))
    }

    private async _checkNativeResolc(build: CompilerBuild): Promise<boolean> {
        const resolcPath = this._getCompilerBinaryPathFromBuild(build)

        try {
            execFile(resolcPath, ["--version"])
            return true
        } catch {
            return false
        }
    }
}
