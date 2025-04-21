import {
    TASK_COMPILE_SOLIDITY_RUN_SOLC,
    TASK_COMPILE_SOLIDITY_RUN_SOLCJS,
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
    TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
    TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS,
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START,
    TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES,
    TASK_COMPILE_REMOVE_OBSOLETE_ARTIFACTS,
    TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
    TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_END,
    TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS,
    TASK_COMPILE,
    TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT,
} from 'hardhat/builtin-tasks/task-names';
import debug from 'debug';
import {
    SolcMultiUserConfigExtractor,
    SolcSoloUserConfigExtractor,
    SolcStringUserConfigExtractor,
    SolcUserConfigExtractor,
} from './config-extractor';
import { defaultNpmResolcConfig, defaultBinaryResolcConfig, RESOLC_ARTIFACT_FORMAT_VERSION } from './constants';
import { extendEnvironment, extendConfig, subtask, task } from 'hardhat/internal/core/config/config-env';
import { Artifacts } from 'hardhat/internal/artifacts';
import {
    ArtifactsEmittedPerFile,
    CompilationJob,
    CompilerInput,
    CompilerOutput,
    HardhatRuntimeEnvironment,
    RunSuperFunction,
    SolcBuild,
    TaskArguments,
} from 'hardhat/types';
import { getArtifactFromContractOutput, pluralize, updateDefaultCompilerConfig } from './utils';
import { compile } from './compile';
import chalk from 'chalk';
import fs from 'fs';
import './type-extensions';
import { ReviveCompilerInput } from './types';

const logDebug = debug('hardhat:core:tasks:compile');

const extractors: SolcUserConfigExtractor[] = [
    new SolcStringUserConfigExtractor(),
    new SolcSoloUserConfigExtractor(),
    new SolcMultiUserConfigExtractor(),
];

extendConfig((config, userConfig) => {
    if (config.resolc.compilerSource !== 'binary') {
        config.resolc = { ...defaultNpmResolcConfig, ...userConfig?.resolc };
        config.resolc.settings = { ...defaultNpmResolcConfig.settings, ...userConfig?.resolc?.settings };
    } else {
        config.resolc = { ...defaultBinaryResolcConfig, ...userConfig?.resolc };
        config.resolc.settings = { ...defaultBinaryResolcConfig.settings, ...userConfig?.resolc?.settings };
    }
});

extendEnvironment((hre) => {
    if (hre.network.config.polkavm) {
        hre.network.polkavm = hre.network.config.polkavm;

        let artifactsPath = hre.config.paths.artifacts;
        if (!artifactsPath.endsWith('-pvm')) {
            artifactsPath = `${artifactsPath}-pvm`;
        }

        let cachePath = hre.config.paths.cache;
        if (!cachePath.endsWith('-pvm')) {
            cachePath = `${cachePath}-pvm`;
        }

        hre.config.paths.artifacts = artifactsPath;
        hre.config.paths.cache = cachePath;
        (hre as any).artifacts = new Artifacts(artifactsPath);
        hre.config.solidity.compilers.forEach(async (compiler) =>
            updateDefaultCompilerConfig({ compiler }, hre.config.resolc),
        );

        for (const [file, compiler] of Object.entries(hre.config.solidity.overrides)) {
            updateDefaultCompilerConfig({ compiler, file }, hre.config.resolc);
        }
    }
});

task(TASK_COMPILE).setAction(
    async (compilationArgs: any, _hre: HardhatRuntimeEnvironment, runSuper: RunSuperFunction<TaskArguments>) => {
        await runSuper(compilationArgs);
    },
);

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES, async (args: { sourcePaths: string[] }, hre, runSuper) => {
    if (!hre.network.polkavm) {
        return await runSuper(args);
    }
    const contractsToCompile: string[] | undefined = hre.config.resolc.settings?.contractsToCompile;

    if (!contractsToCompile || contractsToCompile.length === 0) {
        return await runSuper(args);
    }

    const sourceNames: string[] = await runSuper(args);

    return sourceNames.filter((sourceName) =>
        contractsToCompile.some((contractToCompile) => sourceName.includes(contractToCompile)),
    );
});

subtask(TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOBS, async (args, hre, runSuper) => {
    const { jobs, errors } = await runSuper(args);

    if (!hre.network.polkavm || hre.config.resolc.compilerSource !== 'binary') {
        return { jobs, errors };
    }

    jobs.forEach((job: any) => {
        job.solidityConfig.resolc = hre.config.resolc;
        job.solidityConfig.resolc.settings.compilerPath = hre.config.resolc.settings?.compilerPath;
    });

    return { jobs, errors };
});

subtask(
    TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT,
    async (
        {
            sourceName,
            contractName,
            contractOutput,
        }: {
            sourceName: string;
            contractName: string;
            contractOutput: any;
        },
        hre,
    ): Promise<any> => {
        if (!hre.network.polkavm) {
            return getArtifactFromContractOutput(sourceName, contractName, contractOutput);
        }
        let bytecode: string =
            contractOutput.evm?.bytecode?.object || contractOutput.evm?.deployedBytecode?.object || '';

        return {
            _format: RESOLC_ARTIFACT_FORMAT_VERSION,
            contractName,
            sourceName,
            abi: contractOutput.abi,
            bytecode: `0x${bytecode}`,
            deployedBytecode: `0x${bytecode}`,
            linkReferences: {},
            deployedLinkReferences: {},
        };
    },
);

subtask(TASK_COMPILE_SOLIDITY_RUN_SOLC, async (args: { input: any }, hre, runSuper) => {
    if (!hre.config.networks.hardhat.polkavm) {
        return await runSuper(args);
    }

    return await compile(hre.config.resolc, args.input);
});

subtask(
    TASK_COMPILE_SOLIDITY_COMPILE_SOLC,
    async (
        args: {
            input: CompilerInput;
            quiet: boolean;
            solcVersion: string;
            compilationJob: CompilationJob;
            compilationJobs: CompilationJob[];
            compilationJobIndex: number;
        },
        hre,
        runSuper,
    ): Promise<{ output: CompilerOutput; solcBuild: SolcBuild }> => {
        if (!hre.config.networks.polkavm) {
            return await runSuper(args);
        }

        const solcBuild: SolcBuild = await hre.run(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, {
            quiet: args.quiet,
            solcVersion: args.solcVersion,
            compilationJob: args.compilationJob,
        });

        await hre.run(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START, {
            compilationJob: args.compilationJob,
            compilationJobs: args.compilationJobs,
            compilationJobIndex: args.compilationJobIndex,
            quiet: args.quiet,
        });

        let output;
        if (solcBuild.isSolcJs) {
            output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLCJS, {
                input: args.input,
                solcJsPath: solcBuild.compilerPath,
            });
        } else {
            output = await hre.run(TASK_COMPILE_SOLIDITY_RUN_SOLC, {
                input: args.input,
                solcPath: solcBuild.compilerPath,
            });
        }

        await hre.run(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_END, {
            compilationJob: args.compilationJob,
            compilationJobs: args.compilationJobs,
            compilationJobIndex: args.compilationJobIndex,
            output,
            quiet: args.quiet,
        });

        return { output, solcBuild };
    },
);

subtask(
    TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT,
    async ({ compilationJobs }: { compilationJobs: CompilationJob[] }, hre, _runSuper) => {
        let count = 0;
        for (const job of compilationJobs) {
            count += job.getResolvedFiles().filter((file) => job.emitsArtifacts(file)).length;
        }

        if (count > 0) {
            console.info(chalk.green(`Successfully compiled ${count} Solidity ${pluralize(count, 'file')}`));
        }
    },
);

subtask(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START).setAction(
    async ({
        compilationJob,
    }: {
        compilationJob: CompilationJob;
        compilationJobs: CompilationJob[];
        compilationJobIndex: number;
    }) => {
        const count = compilationJob.getResolvedFiles().length;
        if (count > 0) {
            console.info(chalk.yellow(`Compiling ${count} Solidity ${pluralize(count, 'file')}`));
        }
    },
);

subtask(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS).setAction(
    async (
        {
            compilationJob,
            input,
            output,
            solcBuild,
        }: {
            compilationJob: CompilationJob;
            input: CompilerInput;
            output: CompilerOutput;
            solcBuild: SolcBuild;
        },
        { artifacts, run, network },
        runSuper,
    ): Promise<{
        artifactsEmittedPerFile: ArtifactsEmittedPerFile;
    }> => {
        if (network.config.polkavm !== true) {
            return await runSuper({
                compilationJob,
                input,
                output,
                solcBuild,
            });
        }

        const version: string = compilationJob.getSolcConfig().version;

        const pathToBuildInfo = await artifacts.saveBuildInfo(version, solcBuild.longVersion, input, output);

        const artifactsEmittedPerFile: ArtifactsEmittedPerFile = await Promise.all(
            compilationJob
                .getResolvedFiles()
                .filter((f) => compilationJob.emitsArtifacts(f))
                .map(async (file) => {
                    const artifactsEmitted = await Promise.all(
                        Object.entries(output.contracts?.[file.sourceName] ?? {}).map(
                            async ([contractName, contractOutput]) => {
                                logDebug(`Emitting artifact for contract '${contractName}'`);
                                const artifact = await run(TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT, {
                                    sourceName: file.sourceName,
                                    contractName,
                                    contractOutput,
                                });

                                await artifacts.saveArtifactAndDebugFile(artifact, pathToBuildInfo);

                                return artifact.contractName;
                            },
                        ),
                    );

                    return {
                        file,
                        artifactsEmitted,
                    };
                }),
        );

        return { artifactsEmittedPerFile };
    },
);

subtask(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, async (taskArgs, hre, runSuper) => {
    const compilerInput: ReviveCompilerInput = await runSuper(taskArgs);
    if (!hre.network.polkavm) {
        return compilerInput;
    }

    if (hre.config.resolc.settings?.suppressWarnings && hre.config.resolc.settings.suppressWarnings.length > 0) {
        compilerInput.suppressedWarnings = hre.config.resolc.settings.suppressWarnings;
    }

    return compilerInput;
});

subtask(TASK_COMPILE_REMOVE_OBSOLETE_ARTIFACTS, async (taskArgs, hre, runSuper) => {
    if (!hre.network.polkavm) {
        return await runSuper(taskArgs);
    }

    const artifactsDir = hre.config.paths.artifacts;

    if (artifactsDir.slice(-4) !== '-pvm') fs.rmSync(artifactsDir, { recursive: true });

    const cacheDir = hre.config.paths.cache;

    if (cacheDir.slice(-4) !== '-pvm') fs.rmSync(cacheDir, { recursive: true });
});
