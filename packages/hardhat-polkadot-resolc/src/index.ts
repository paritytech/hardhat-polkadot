import {
    TASK_COMPILE_SOLIDITY_RUN_SOLC,
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
    TASK_COMPILE_REMOVE_OBSOLETE_ARTIFACTS,
    TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
    TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_END,
    TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS,
    TASK_COMPILE,
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
    TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_COMPILER_START,
    TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_COMPILER_END,
} from "hardhat/builtin-tasks/task-names"
import debug from "debug"
import { extendEnvironment, extendConfig, subtask, task } from "hardhat/config"
import { getCompilersDir } from "hardhat/internal/util/global-dir"
import { Artifacts } from "hardhat/internal/artifacts"
import { CompilerPlatform } from "hardhat/internal/solidity/compiler/downloader"
import type {
    ArtifactsEmittedPerFile,
    CompilationJob,
    CompilerInput,
    CompilerOutput,
    CompilerOutputContract,
    HardhatRuntimeEnvironment,
    RunSuperFunction,
    SolcBuild,
    TaskArguments,
    NetworkConfig,
} from "hardhat/types"
import { assertHardhatInvariant } from "hardhat/internal/core/errors"
import chalk from "chalk"
import fs from "fs"

import { getArtifactFromContractOutput, pluralize, updateDefaultCompilerConfig } from "./utils"
import { compile } from "./compile"
import {
    defaultNpmResolcConfig,
    defaultBinaryResolcConfig,
    RESOLC_ARTIFACT_FORMAT_VERSION,
    TASK_COMPILE_SOLIDITY_GET_RESOLC_BUILD,
    TASK_COMPILE_SOLIDITY_COMPILE_RESOLC,
    TASK_COMPILE_SOLIDITY_RUN_RESOLC,
    TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_RESOLC_COMPILER_START,
} from "./constants"
import "./type-extensions"
import type { ResolcBuild, ReviveCompilerInput } from "./types"
import { ResolcPluginError } from "./errors"
import { ResolcCompilerDownloader } from "./downloader"

const logDebug = debug("hardhat:core:tasks:compile")

extendConfig((config, userConfig) => {
    // Check if any network is using the polkavm flag
    const hasPolkavm = Object.values(config.networks).some(
        (network: NetworkConfig) => network && network.polkavm,
    )
    if (!hasPolkavm) return

    // We check for `npm` as `compilerSource`, because for every other case
    // we prefer using the binary.
    const isNpm = config.resolc?.compilerSource === "npm"
    const defaultConfig = isNpm ? defaultNpmResolcConfig : defaultBinaryResolcConfig
    const customConfig = userConfig?.resolc || {}

    const optimizer = Object.assign(
        {},
        defaultConfig.settings?.optimizer,
        customConfig.settings?.optimizer,
    )

    config.resolc = {
        ...defaultConfig,
        ...customConfig,
        settings: {
            ...customConfig.settings,
            optimizer,
        },
    }
})

extendEnvironment((hre) => {
    if (!hre.network.config.polkavm) return

    hre.network.polkavm = hre.network.config.polkavm

    let artifactsPath = hre.config.paths.artifacts
    if (!artifactsPath.endsWith("-pvm")) {
        artifactsPath = `${artifactsPath}-pvm`
    }

    let cachePath = hre.config.paths.cache
    if (!cachePath.endsWith("-pvm")) {
        cachePath = `${cachePath}-pvm`
    }

    hre.config.paths.artifacts = artifactsPath
    hre.config.paths.cache = cachePath
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(hre as any).artifacts = new Artifacts(artifactsPath)

    if (
        (hre.config.solidity.compilers.length > 1 && hre.config.resolc.compilerSource === "npm") ||
        (Object.entries(hre.config.solidity.overrides).length > 1 &&
            hre.config.resolc.compilerSource === "npm")
    ) {
        throw new ResolcPluginError(
            `Multiple solidity versions are not available when using npm as the compiler.`,
        )
    }

    hre.config.solidity.compilers.forEach(async (compiler) =>
        updateDefaultCompilerConfig({ compiler }, hre.config.resolc),
    )

    for (const [file, compiler] of Object.entries(hre.config.solidity.overrides)) {
        updateDefaultCompilerConfig({ compiler, file }, hre.config.resolc)
    }
})

task(TASK_COMPILE).setAction(
    async (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        compilationArgs: any,
        _hre: HardhatRuntimeEnvironment,
        runSuper: RunSuperFunction<TaskArguments>,
    ) => {
        await runSuper(compilationArgs)
    },
)

subtask(
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
    async (args: { sourcePaths: string[] }, hre, runSuper) => {
        if (!hre.network.polkavm) {
            return await runSuper(args)
        }
        const contractsToCompile: string[] | undefined =
            hre.config.resolc.settings?.contractsToCompile

        if (!contractsToCompile || contractsToCompile.length === 0) {
            return await runSuper(args)
        }

        const sourceNames: string[] = await runSuper(args)

        return sourceNames.filter((sourceName) =>
            contractsToCompile.some((contractToCompile) => sourceName.includes(contractToCompile)),
        )
    },
)

subtask(
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
    async (
        {
            sourceName,
            contractName,
            contractOutput,
        }: {
            sourceName: string
            contractName: string
            contractOutput: CompilerOutputContract
        },
        hre,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any> => {
        if (!hre.network.polkavm) {
            return getArtifactFromContractOutput(sourceName, contractName, contractOutput)
        }
        const bytecode: string =
            contractOutput.evm?.bytecode?.object ||
            contractOutput.evm?.deployedBytecode?.object ||
            ""

        return {
            _format: RESOLC_ARTIFACT_FORMAT_VERSION,
            contractName,
            sourceName,
            abi: contractOutput.abi,
            bytecode: `0x${bytecode}`,
            deployedBytecode: `0x${bytecode}`,
            linkReferences: {},
            deployedLinkReferences: {},
        }
    },
)

subtask(
    TASK_COMPILE_SOLIDITY_RUN_SOLC,
    async (
        args: { input: CompilerInput; solcPath: string; solcVersion: string },
        hre,
        runSuper,
    ) => {
        if (!hre.network.polkavm) {
            return await runSuper(args)
        }

        return await hre.run(TASK_COMPILE_SOLIDITY_RUN_RESOLC, {
            input: args.input,
            solcPath: args.solcPath,
            solcVersion: args.solcVersion,
        })
    },
)

subtask(
    TASK_COMPILE_SOLIDITY_RUN_RESOLC,
    async (args: { input: CompilerInput; resolcPath: string; solcPath: string }, hre) => {
        const config = {
            ...hre.config.resolc,
            settings: {
                resolcPath: args.resolcPath,
                solcPath: args.solcPath,
                ...hre.config.resolc.settings,
            },
        }
        const compOut = await compile(config, args.input)

        // This is made to be compatible with @openzeppelin/hardhat-upgrades
        Object.keys(compOut.contracts).map((file) => {
            Object.keys(compOut.contracts[file]).map((contract) => {
                const bytecode = compOut.contracts[file][contract].evm.bytecode
                    ? compOut.contracts[file][contract].evm.bytecode.object
                    : ""
                compOut.contracts[file][contract].evm.bytecode = {
                    functionDebugData: {},
                    generatedSources: [],
                    linkReferences: {},
                    object: bytecode,
                    opcodes: "",
                    sourceMap: "",
                }
            })
        })
        return compOut
    },
)

subtask(
    TASK_COMPILE_SOLIDITY_COMPILE_RESOLC,
    async (
        args: {
            input: CompilerInput
            quiet: boolean
            solcVersion: string
            compilationJob: CompilationJob
            compilationJobs: CompilationJob[]
            compilationJobIndex: number
        },
        hre,
    ): Promise<{ output: CompilerOutput; solcBuild: SolcBuild; resolcBuild: ResolcBuild }> => {
        const solcBuild: SolcBuild = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, {
            quiet: args.quiet,
            solcVersion: args.solcVersion,
            compilationJob: args.compilationJob,
        })

        const resolcBuild: ResolcBuild = await hre.run(TASK_COMPILE_SOLIDITY_GET_RESOLC_BUILD, {
            quiet: args.quiet,
            resolcVersion: hre.config.resolc.version,
            compilationJob: args.compilationJob,
        })

        await hre.run(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START, {
            compilationJob: args.compilationJob,
            compilationJobs: args.compilationJobs,
            compilationJobIndex: args.compilationJobIndex,
            quiet: args.quiet,
        })

        const output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_RESOLC, {
            input: args.input,
            resolcPath: resolcBuild.resolcPath,
            solcPath: solcBuild.compilerPath,
        })

        await hre.run(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_END, {
            compilationJob: args.compilationJob,
            compilationJobs: args.compilationJobs,
            compilationJobIndex: args.compilationJobIndex,
            output,
            quiet: args.quiet,
        })

        return { output, solcBuild, resolcBuild }
    },
)

subtask(
    TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
    async (
        args: {
            input: CompilerInput
            quiet: boolean
            solcVersion: string
            compilationJob: CompilationJob
            compilationJobs: CompilationJob[]
            compilationJobIndex: number
        },
        hre,
        runSuper,
    ): Promise<{ output: CompilerOutput; solcBuild: SolcBuild }> => {
        if (!hre.network.polkavm) {
            return await runSuper(args)
        }

        return await hre.run(TASK_COMPILE_SOLIDITY_COMPILE_RESOLC, args)
    },
)

subtask(TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_RESOLC_COMPILER_START).setAction(
    async ({
        isCompilerDownloaded,
        resolcVersion,
    }: {
        isCompilerDownloaded: boolean
        quiet: boolean
        resolcVersion: string
    }) => {
        if (isCompilerDownloaded) {
            return
        }

        if (resolcVersion === "latest") {
            console.log(`Downloading ${resolcVersion} version of the resolc compiler`)
        } else {
            console.log(`Downloading resolc compiler ${resolcVersion}`)
        }
    },
)

subtask(TASK_COMPILE_SOLIDITY_GET_RESOLC_BUILD).setAction(
    async (
        {
            quiet,
            resolcVersion,
        }: {
            quiet: boolean
            resolcVersion: string
        },
        { run },
    ): Promise<ResolcBuild> => {
        const compilersCache = await getCompilersDir()

        const compilerPlatform = ResolcCompilerDownloader.getCompilerPlatform()
        const downloader = ResolcCompilerDownloader.getConcurrencySafeDownloader(
            compilerPlatform,
            compilersCache,
        )

        await downloader.downloadCompiler(
            resolcVersion,
            async (isCompilerDownloaded: boolean) => {
                await run(TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_RESOLC_COMPILER_START, {
                    resolcVersion: resolcVersion,
                    isCompilerDownloaded,
                    quiet,
                })
            },
            async (isCompilerDownloaded: boolean) => {
                await run(TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_COMPILER_END, {
                    solcVersion: resolcVersion,
                    isCompilerDownloaded,
                    quiet,
                })
            },
        )

        const compiler = await downloader.getCompiler(resolcVersion)

        if (compiler !== undefined) {
            return compiler
        }

        logDebug(
            "Native resolc binary doesn't work, using wasm instead. Try running npx hardhat clean --global",
        )

        const wasmDownloader = ResolcCompilerDownloader.getConcurrencySafeDownloader(
            CompilerPlatform.WASM,
            compilersCache,
        )

        await wasmDownloader.downloadCompiler(
            resolcVersion,
            async (isCompilerDownloaded: boolean) => {
                await run(TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_COMPILER_START, {
                    solcVersion: resolcVersion,
                    isCompilerDownloaded,
                    quiet,
                })
            },
            async (isCompilerDownloaded: boolean) => {
                await run(TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_COMPILER_END, {
                    solcVersion: resolcVersion,
                    isCompilerDownloaded,
                    quiet,
                })
            },
        )

        const wasmCompiler = await wasmDownloader.getCompiler(resolcVersion)

        assertHardhatInvariant(
            wasmCompiler !== undefined,
            `WASM build of resolc ${resolcVersion} isn't working`,
        )

        return wasmCompiler
    },
)

subtask(
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    async ({ compilationJobs }: { compilationJobs: CompilationJob[] }, _hre, _runSuper) => {
        let count = 0
        for (const job of compilationJobs) {
            count += job.getResolvedFiles().filter((file) => job.emitsArtifacts(file)).length
        }

        if (count > 0) {
            console.info(
                chalk.green(`Successfully compiled ${count} Solidity ${pluralize(count, "file")}`),
            )
        }
    },
)

subtask(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START).setAction(
    async ({
        compilationJob,
    }: {
        compilationJob: CompilationJob
        compilationJobs: CompilationJob[]
        compilationJobIndex: number
    }) => {
        const count = compilationJob.getResolvedFiles().length
        if (count > 0) {
            console.info(chalk.yellow(`Compiling ${count} Solidity ${pluralize(count, "file")}`))
        }
    },
)

subtask(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(
    async (
        {
            compilationJob,
            input,
            output,
            solcBuild,
        }: {
            compilationJob: CompilationJob
            input: CompilerInput
            output: CompilerOutput
            solcBuild: SolcBuild
        },
        { artifacts, run, network },
        runSuper,
    ): Promise<{
        artifactsEmittedPerFile: ArtifactsEmittedPerFile
    }> => {
        if (network.config.polkavm !== true) {
            return await runSuper({
                compilationJob,
                input,
                output,
                solcBuild,
            })
        }

        const version: string = compilationJob.getSolcConfig().version

        const pathToBuildInfo = await artifacts.saveBuildInfo(
            version,
            solcBuild.longVersion,
            input,
            output,
        )

        const artifactsEmittedPerFile: ArtifactsEmittedPerFile = await Promise.all(
            compilationJob
                .getResolvedFiles()
                .filter((f) => compilationJob.emitsArtifacts(f))
                .map(async (file) => {
                    const artifactsEmitted = await Promise.all(
                        Object.entries(output.contracts?.[file.sourceName] ?? {}).map(
                            async ([contractName, contractOutput]) => {
                                logDebug(`Emitting artifact for contract '${contractName}'`)
                                const artifact = await run(
                                    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
                                    {
                                        sourceName: file.sourceName,
                                        contractName,
                                        contractOutput,
                                    },
                                )

                                await artifacts.saveArtifactAndDebugFile(artifact, pathToBuildInfo)

                                return artifact.contractName
                            },
                        ),
                    )

                    return {
                        file,
                        artifactsEmitted,
                    }
                }),
        )

        return { artifactsEmittedPerFile }
    },
)

subtask(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, async (taskArgs, hre, runSuper) => {
    const compilerInput: ReviveCompilerInput = await runSuper(taskArgs)
    if (!hre.network.polkavm) {
        return compilerInput
    }

    return compilerInput
})

subtask(TASK_COMPILE_REMOVE_OBSOLETE_ARTIFACTS, async (taskArgs, hre, runSuper) => {
    if (!hre.network.polkavm) {
        return await runSuper(taskArgs)
    }

    const artifactsDir = hre.config.paths.artifacts

    if (artifactsDir.slice(-4) !== "-pvm") fs.rmSync(artifactsDir, { recursive: true })

    const cacheDir = hre.config.paths.cache

    if (cacheDir.slice(-4) !== "-pvm") fs.rmSync(cacheDir, { recursive: true })
})
