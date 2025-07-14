import path from "path";
import fsExtra from "fs-extra";
import debug from "debug";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import axios from 'axios';

import { download } from "./download";
import { assertHardhatInvariant, HardhatError } from "hardhat/internal/core/errors";
import { ERRORS } from "hardhat/internal/core/errors-list";
import { MultiProcessMutex } from "hardhat/internal/util/multi-process-mutex";
import { listAttributesSync, removeAttributeSync } from "fs-xattr";

const log = debug("hardhat:core:resolc:downloader");

const COMPILER_REPOSITORY_URL = "https://github.com/paritytech/revive/releases/download/";

export enum CompilerPlatform {
    LINUX = "linux-amd64",
    WINDOWS = "windows-amd64",
    MACOS = "macosx-amd64",
    WASM = "wasm",
}

export enum CompilerName {
    LINUX = "resolc-x86_64-unknown-linux-musl",
    WINDOWS = "resolc-x86_64-pc-windows-msvc.exe",
    MACOS = "resolc-universal-apple-darwin",
    WASM = "resolc.wasm",
}
export interface Compiler {
    version: string;
    longVersion: string;
    compilerPath: string;
    isJs: boolean;
}

export interface CompilerBuild {
    name: CompilerName;
    path: string;
    version: string;
    build: string;
    longVersion: string;
    sha256: string;
    platform: CompilerPlatform;
}

export interface CompilerList {
    builds: CompilerBuild[];
    releases: { [version: string]: string };
    latestRelease: string;
}

/**
 * A compiler downloader which must be specialized per-platform. It can't and
 * shouldn't support multiple platforms at the same time.
 */
export interface ICompilerDownloader {
    /**
     * Returns true if the compiler has been downloaded.
     *
     * This function access the filesystem, but doesn't modify it.
     */
    isCompilerDownloaded(version: string): Promise<boolean>;

    /**
     * Downloads the compiler for a given version, which can later be obtained
     * with getCompiler.
     */
    downloadCompiler(
        version: string,
        downloadStartedCb: (isCompilerDownloaded: boolean) => Promise<any>,
        downloadEndedCb: (isCompilerDownloaded: boolean) => Promise<any>
    ): Promise<void>;

    /**
     * Returns the compiler, which MUST be downloaded before calling this function.
     *
     * Returns undefined if the compiler has been downloaded but can't be run.
     *
     * This function access the filesystem, but doesn't modify it.
     */
    getCompiler(version: string): Promise<Compiler | undefined>;
}

/**
 * Default implementation of ICompilerDownloader.
 *
 * Important things to note:
 *   1. If a compiler version is not found, this downloader may fail.
 *    1.1. It only re-downloads the list of compilers once every X time.
 *      1.1.1 If a user tries to download a new compiler before X amount of time
 *      has passed since its release, they may need to clean the cache, as
 *      indicated in the error messages.
 */
export class CompilerDownloader implements ICompilerDownloader {
    public static getCompilerPlatform(): CompilerPlatform {
        // TODO: This check is seriously wrong. It doesn't take into account
        //  the architecture nor the toolchain. This should check the triplet of
        //  system instead (see: https://wiki.osdev.org/Target_Triplet).
        //
        //  The only reason this downloader works is that it validates if the
        //  binaries actually run.
        switch (os.platform()) {
            case "win32":
                return CompilerPlatform.WINDOWS;
            case "linux":
                return CompilerPlatform.LINUX;
            case "darwin":
                return CompilerPlatform.MACOS;
            default:
                return CompilerPlatform.WASM;
        }
    }

    public static getCompilerName(): CompilerName {
        // TODO: This check is seriously wrong. It doesn't take into account
        //  the architecture nor the toolchain. This should check the triplet of
        //  system instead (see: https://wiki.osdev.org/Target_Triplet).
        //
        //  The only reason this downloader works is that it validates if the
        //  binaries actually run.
        switch (os.platform()) {
            case "win32":
                return CompilerName.WINDOWS;
            case "linux":
                return CompilerName.LINUX;
            case "darwin":
                return CompilerName.MACOS;
            default:
                return CompilerName.WASM;
        }
    }

    private static _downloaderPerPlatform: Map<string, CompilerDownloader> =
        new Map();

    public static getConcurrencySafeDownloader(
        platform: CompilerPlatform,
        compilersDir: string
    ) {
        const key = platform + compilersDir;

        if (!this._downloaderPerPlatform.has(key)) {
            this._downloaderPerPlatform.set(
                key,
                new CompilerDownloader(platform, compilersDir)
            );
        }

        return this._downloaderPerPlatform.get(key)!;
    }

    public static defaultCompilerListCachePeriod = 3_600_00;
    private readonly _mutex = new MultiProcessMutex("compiler-download");

    /**
     * Use CompilerDownloader.getConcurrencySafeDownloader instead
     */
    constructor(
        private readonly _platform: CompilerPlatform,
        private readonly _compilersDir: string,
        private readonly _compilerListCachePeriodMs = CompilerDownloader.defaultCompilerListCachePeriod,
        private readonly _downloadFunction: typeof download = download
    ) { }

    public async isCompilerDownloaded(version: string): Promise<boolean> {
        const build = await this._getCompilerBuild(version);

        if (build === undefined) {
            return false;
        }

        const downloadPath = this._getCompilerBinaryPathFromBuild(build);

        return fsExtra.pathExists(downloadPath);
    }

    public async downloadCompiler(
        version: string,
        downloadStartedCb: (isCompilerDownloaded: boolean) => Promise<any>,
        downloadEndedCb: (isCompilerDownloaded: boolean) => Promise<any>
    ): Promise<void> {
        // Since only one process at a time can acquire the mutex, we avoid the risk of downloading the same compiler multiple times.
        // This is because the mutex blocks access until a compiler has been fully downloaded, preventing any new process
        // from checking whether that version of the compiler exists. Without mutex it might incorrectly
        // return false, indicating that the compiler isn't present, even though it is currently being downloaded.
        await this._mutex.use(async () => {
            const isCompilerDownloaded = await this.isCompilerDownloaded(version);

            if (isCompilerDownloaded === true) {
                return;
            }

            await downloadStartedCb(isCompilerDownloaded);

            let build = await this._getCompilerBuild(version);

            if (build === undefined && (await this._shouldDownloadCompilerList())) {
                try {
                    await this._downloadCompilerList();
                } catch (e: any) {
                    throw new HardhatError(
                        ERRORS.SOLC.VERSION_LIST_DOWNLOAD_FAILED,
                        {},
                        e
                    );
                }

                build = await this._getCompilerBuild(version);
            }

            if (build === undefined) {
                throw new HardhatError(ERRORS.SOLC.INVALID_VERSION, { version });
            }

            let downloadPath: string;
            try {
                downloadPath = await this._downloadCompiler(build);
            } catch (e: any) {
                throw new HardhatError(
                    ERRORS.SOLC.DOWNLOAD_FAILED,
                    {
                        remoteVersion: build.longVersion,
                    },
                    e
                );
            }

            const verified = await this._verifyCompilerDownload(build, downloadPath);
            if (!verified) {
                throw new HardhatError(ERRORS.SOLC.INVALID_DOWNLOAD, {
                    remoteVersion: build.longVersion,
                });
            }

            await this._postProcessCompilerDownload(build, downloadPath);

            await downloadEndedCb(isCompilerDownloaded);
        });
    }

    public async getCompiler(version: string): Promise<Compiler | undefined> {
        const build = await this._getCompilerBuild(version);

        assertHardhatInvariant(
            build !== undefined,
            "Trying to get a compiler before it was downloaded"
        );

        const compilerPath = this._getCompilerBinaryPathFromBuild(build);

        assertHardhatInvariant(
            await fsExtra.pathExists(compilerPath),
            "Trying to get a compiler before it was downloaded"
        );

        if (await fsExtra.pathExists(this._getCompilerDoesntWorkFile(build))) {
            return undefined;
        }

        return {
            version,
            longVersion: build.longVersion,
            compilerPath,
            isJs: this._platform === CompilerPlatform.WASM,
        };
    }

    private async _downloadCompilerList(): Promise<void> {

        const url = 'https://api.github.com/repos/paritytech/revive/releases';
        const downloadPath = this._getCompilerListPath();
        const name = CompilerDownloader.getCompilerName()
        const platform = CompilerDownloader.getCompilerPlatform()

        await this._downloadFunction(url, downloadPath, name, platform)
    }

    private _getCompilerListPath(): string {
        return path.join(this._compilersDir, this._platform, "list.json");
    }

    private async _shouldDownloadCompilerList(): Promise<boolean> {
        const listPath = this._getCompilerListPath();
        if (!(await fsExtra.pathExists(listPath))) {
            return true;
        }

        const stats = await fsExtra.stat(listPath);
        const age = new Date().valueOf() - stats.ctimeMs;

        return age > this._compilerListCachePeriodMs;
    }

    private async _getCompilerBuild(
        version: string
    ): Promise<CompilerBuild | undefined> {
        const listPath = this._getCompilerListPath();
        if (!(await fsExtra.pathExists(listPath))) {
            return undefined;
        }

        const list = await this._readCompilerList(listPath);
        return list.builds.find((b) => b.version === version);
    }

    private async _readCompilerList(listPath: string): Promise<CompilerList> {
        return fsExtra.readJSON(listPath);
    }

    private _getCompilerDownloadPathFromBuild(build: CompilerBuild): string {
        return path.join(this._compilersDir, this._platform, build.path);
    }

    private _getCompilerBinaryPathFromBuild(build: CompilerBuild): string {
        const downloadPath = this._getCompilerDownloadPathFromBuild(build);

        if (
            this._platform !== CompilerPlatform.WINDOWS ||
            !downloadPath.endsWith(".zip")
        ) {
            return downloadPath;
        }
        return path.join(this._compilersDir, build.version, "resolc-x86_64-pc-windows-msvc.exe");
    }

    private _getCompilerDoesntWorkFile(build: CompilerBuild): string {
        return `${this._getCompilerBinaryPathFromBuild(build)}.does.not.work`;
    }

    private async _downloadCompiler(build: CompilerBuild): Promise<string> {
        log(`Downloading resolc compiler ${build.longVersion}`);
        const url = `${COMPILER_REPOSITORY_URL}/v${build.version}/${build.name}`;
        const downloadPath = this._getCompilerDownloadPathFromBuild(build);
        const name = CompilerDownloader.getCompilerName()
        const platform = CompilerDownloader.getCompilerPlatform()

        await this._downloadFunction(url, downloadPath, name, platform);

        return downloadPath;
    }

    private async _verifyCompilerDownload(
        build: CompilerBuild,
        downloadPath: string
    ): Promise<boolean> {
        const { bytesToHex } =
            require("@ethereumjs/util") as typeof import("@ethereumjs/util");
        const { sha256 } = await import("./utils");

        const expectedSha256 = build.sha256;
        const compiler = await fsExtra.readFile(downloadPath);

        const compilerSha256 = bytesToHex(sha256(compiler));

        if (expectedSha256 !== compilerSha256) {
            await fsExtra.unlink(downloadPath);
            return false;
        }

        return true;
    }

    private async _postProcessCompilerDownload(
        build: CompilerBuild,
        downloadPath: string
    ): Promise<void> {
        if (this._platform === CompilerPlatform.WASM) {
            return;
        }

        if (
            this._platform === CompilerPlatform.LINUX
        ) {
            fsExtra.chmodSync(downloadPath, 0o755);
        } else if
            (
            this._platform === CompilerPlatform.MACOS
        ) {
            fsExtra.chmodSync(downloadPath, 0o755);
            const attributes = listAttributesSync(downloadPath);
            for (const attr of attributes) {
                removeAttributeSync(downloadPath, attr)
            }
        }

        log("Checking native resolc binary");
        const nativeResolcWorks = await this._checkNativeResolc(build);

        if (nativeResolcWorks) {
            return;
        }

        await fsExtra.createFile(this._getCompilerDoesntWorkFile(build));
    }

    private async _checkNativeResolc(build: CompilerBuild): Promise<boolean> {
        const resolcPath = this._getCompilerBinaryPathFromBuild(build);
        const execFileP = promisify(execFile);

        try {
            await execFileP(resolcPath, ["--version"]);
            return true;
        } catch {
            return false;
        }
    }
}
