import picocolors from 'picocolors';
import fsExtra from 'fs-extra';
import path from 'path';

import { HARDHAT_POLKADOT_NAME } from '../constants';
import { getRecommendedGitIgnore } from '../project-structure';
import { getAllFilesMatching } from './fs-utils';
import { fromEntries } from './lang';
import { getPackageJson, getPackageRoot, PackageJson } from './packageInfo';
import { pluralize } from './strings';
import { confirmRecommendedDepsInstallation, confirmProjectCreation } from './prompt';
import { Dependencies, PackageManager } from './types';

enum Action {
    CREATE_JAVASCRIPT_PROJECT_ACTION = 'Create a JavaScript project',
    CREATE_TYPESCRIPT_PROJECT_ACTION = 'Create a TypeScript project',
    CREATE_TYPESCRIPT_VIEM_PROJECT_ACTION = 'Create a TypeScript project (with Viem)',
    CREATE_EMPTY_HARDHAT_CONFIG_ACTION = 'Create an empty hardhat.config.js',
    QUIT_ACTION = 'Quit',
}

type SampleProjectTypeCreationAction =
    | Action.CREATE_JAVASCRIPT_PROJECT_ACTION
    | Action.CREATE_TYPESCRIPT_PROJECT_ACTION
    | Action.CREATE_TYPESCRIPT_VIEM_PROJECT_ACTION;

const HARDHAT_PACKAGE_NAME = '@parity/hardhat-polkadot';

const PROJECT_DEPENDENCIES: Dependencies = {};

const ETHERS_PROJECT_DEPENDENCIES: Dependencies = {
    '@nomicfoundation/hardhat-toolbox': '^5.0.0',
};

const PEER_DEPENDENCIES: Dependencies = {
    hardhat: '<2.23.8',
    '@nomicfoundation/hardhat-verify': '^2.0.0',
    chai: '^4.2.0',
    'hardhat-gas-reporter': '^1.0.8',
    'solidity-coverage': '^0.8.0',
    '@nomicfoundation/hardhat-ignition': '^0.15.9',
};

const ETHERS_PEER_DEPENDENCIES: Dependencies = {
    '@nomicfoundation/hardhat-chai-matchers': '2.0.8',
    '@nomicfoundation/hardhat-ethers': '3.0.8',
    ethers: '^6.4.0',
    '@typechain/hardhat': '9.1.0',
    typechain: '8.3.2',
    '@typechain/ethers-v6': '0.5.1',
    '@nomicfoundation/hardhat-ignition-ethers': '0.15.11',
};

const VIEM_PEER_DEPENDENCIES: Dependencies = {
    '@nomicfoundation/hardhat-viem': '2.0.6',
    viem: '^2.7.6',
};

const TYPESCRIPT_DEPENDENCIES: Dependencies = {};

const TYPESCRIPT_PEER_DEPENDENCIES: Dependencies = {
    '@types/chai': '^5.2.1',
    '@types/mocha': '^10.0.10',
    '@types/node': '>=18.0.0',
    'ts-node': '>=8.0.0',
    typescript: '>=4.5.0',
};

const TYPESCRIPT_ETHERS_PEER_DEPENDENCIES: Dependencies = {
    typescript: '>=4.5.0',
};

const TYPESCRIPT_VIEM_PEER_DEPENDENCIES: Dependencies = {
    '@types/chai-as-promised': '^7.1.6',
    typescript: '~5.0.4',
};
const pink = '\x1b[38;2;230;0;122m';

// generated with the "colossal" font
// prettier-ignore
function printAsciiLogo() {
    console.log(`${pink}888    888                      888 888               888         `);
    console.log(`${pink}888    888                      888 888               888         `);
    console.log(`${pink}888    888                      888 888               888         `);
    console.log(`${pink}8888888888  8888b.  888d888 .d88888 88888b.   8888b.  888888      `);
    console.log(`${pink}888    888     "88b 888P"  d88" 888 888 "88b     "88b 888         `);
    console.log(`${pink}888    888 .d888888 888    888  888 888  888 .d888888 888         `);
    console.log(`${pink}888    888 888  888 888    Y88b 888 888  888 888  888 Y88b.       `);
    console.log(`${pink}888    888 "Y888888 888     "Y88888 888  888 "Y888888  "Y888      `);
    console.log('');
    console.log(`${pink}8888888b.          888 888                    888          888             `);
    console.log(`${pink}888   Y88b         888 888                    888          888             `);
    console.log(`${pink}888    888         888 888                    888          888             `);
    console.log(`${pink}888   d88P .d88b.  888 888  888  8888b.   .d88888  .d88b.  888888          `);
    console.log(`${pink}8888888P" d88""88b 888 888 .88P     "88b d88" 888 d88""88b 888             `);
    console.log(`${pink}888       888  888 888 888888K  .d888888 888  888 888  888 888             `);
    console.log(`${pink}888       Y88..88P 888 888 "88b 888  888 Y88b 888 Y88..88P Y88b.           `);
    console.log(`${pink}888        "Y88P"  888 888  888 "Y888888  "Y88888  "Y88P"   "Y888          `);
    console.log('');
}

async function printWelcomeMessage() {
    const packageJson = await getPackageJson()

    console.log(
        picocolors.cyan(`⭕️ Welcome to ${HARDHAT_POLKADOT_NAME} v${packageJson.version}\n ⭕️`),
    )
}

async function copySampleProject(projectRoot: string, projectType: SampleProjectTypeCreationAction, isEsm: boolean) {
    const packageRoot = getPackageRoot();

    let sampleProjectName: string;
    if (projectType === Action.CREATE_JAVASCRIPT_PROJECT_ACTION) {
        if (isEsm) {
            sampleProjectName = 'javascript-esm';
        } else {
            sampleProjectName = 'javascript';
        }
    } else {
        if (isEsm) {
            throw new Error("Shouldn't try to create a TypeScript project in an ESM based project");
        } else if (projectType === Action.CREATE_TYPESCRIPT_VIEM_PROJECT_ACTION) {
            sampleProjectName = 'typescript-viem';
        } else {
            sampleProjectName = 'typescript';
        }
    }

    await fsExtra.ensureDir(projectRoot);

    const sampleProjectPath = path.join(packageRoot, 'sample-projects', sampleProjectName);

    // relative paths to all the sample project files
    const sampleProjectFiles = (await getAllFilesMatching(sampleProjectPath)).map((file) =>
        path.relative(sampleProjectPath, file),
    );

    // check if the target directory already has files that clash with the sample
    // project files
    const existingFiles: string[] = [];
    for (const file of sampleProjectFiles) {
        const targetProjectFile = path.resolve(projectRoot, file);

        // if the project already has a README.md file, we'll skip it when
        // we copy the files
        if (file !== 'README.md' && fsExtra.existsSync(targetProjectFile)) {
            existingFiles.push(file);
        }
    }

    if (existingFiles.length > 0) {
        const errorMsg = `We couldn't initialize the sample project because ${pluralize(
            existingFiles.length,
            'this file already exists',
            'these files already exist',
        )}: ${existingFiles.join(', ')}

Please delete or rename ${pluralize(existingFiles.length, 'it', 'them')} and try again.`;
        console.log(picocolors.red(errorMsg));
        process.exit(1);
    }

    // copy the files
    for (const file of sampleProjectFiles) {
        const sampleProjectFile = path.resolve(sampleProjectPath, file);
        const targetProjectFile = path.resolve(projectRoot, file);

        if (file === 'README.md' && fsExtra.existsSync(targetProjectFile)) {
            // we don't override the readme if it exists
            continue;
        }

        if (file === 'LICENSE.md') {
            // we don't copy the license
            continue;
        }

        fsExtra.copySync(sampleProjectFile, targetProjectFile);
    }
}

async function addGitIgnore(projectRoot: string) {
    const gitIgnorePath = path.join(projectRoot, '.gitignore');

    let content = await getRecommendedGitIgnore();

    if (await fsExtra.pathExists(gitIgnorePath)) {
        const existingContent = await fsExtra.readFile(gitIgnorePath, 'utf-8');
        content = `${existingContent}
${content}`;
    }

    await fsExtra.writeFile(gitIgnorePath, content);
}

async function printRecommendedDepsInstallationInstructions(projectType: SampleProjectTypeCreationAction) {
    console.log(`You need to install these dependencies to run the sample project:`);

    const cmd = await getRecommendedDependenciesInstallationCommand(await getDependencies(projectType));

    console.log(`  ${cmd.join(' ')}`);
}

// exported so we can test that it uses the latest supported version of solidity
export const EMPTY_HARDHAT_CONFIG = `/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
};
`;

async function writeEmptyHardhatConfig(isEsm: boolean) {
    const hardhatConfigFilename = isEsm ? 'hardhat.config.cjs' : 'hardhat.config.js';

    return fsExtra.writeFile(hardhatConfigFilename, EMPTY_HARDHAT_CONFIG, 'utf-8');
}

async function getAction(isEsm: boolean): Promise<Action> {
    if (process.env.HARDHAT_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS !== undefined) {
        return Action.CREATE_JAVASCRIPT_PROJECT_ACTION;
    } else if (process.env.HARDHAT_CREATE_TYPESCRIPT_PROJECT_WITH_DEFAULTS !== undefined) {
        return Action.CREATE_TYPESCRIPT_PROJECT_ACTION;
    } else if (process.env.HARDHAT_CREATE_TYPESCRIPT_VIEM_PROJECT_WITH_DEFAULTS !== undefined) {
        return Action.CREATE_TYPESCRIPT_VIEM_PROJECT_ACTION;
    }

    const { default: enquirer } = await import('enquirer');
    try {
        const actionResponse = await enquirer.prompt<{ action: string }>([
            {
                name: 'action',
                type: 'select',
                message: 'What do you want to do?',
                initial: 0,
                choices: Object.values(Action)
                    .filter((a: Action) => {
                        if (isEsm && a === Action.CREATE_TYPESCRIPT_VIEM_PROJECT_ACTION) {
                            // we omit the viem option for ESM projects to avoid showing
                            // two disabled options
                            return false;
                        }

                        return true;
                    })
                    .map((a: Action) => {
                        let message: string;
                        if (isEsm) {
                            if (a === Action.CREATE_EMPTY_HARDHAT_CONFIG_ACTION) {
                                message = a.replace('.js', '.cjs');
                            } else if (a === Action.CREATE_TYPESCRIPT_PROJECT_ACTION) {
                                message = `${a} (not available for ESM projects)`;
                            } else {
                                message = a;
                            }
                        } else {
                            message = a;
                        }

                        return {
                            name: a,
                            message,
                            value: a,
                        };
                    }),
            },
        ]);

        if ((Object.values(Action) as string[]).includes(actionResponse.action)) {
            return actionResponse.action as Action;
        } else {
            throw new Error('Trying to perform unsupported operation.');
        }
    } catch (e) {
        if (e === '') {
            return Action.QUIT_ACTION;
        }

        throw e;
    }
}

async function createPackageJson() {
    await fsExtra.writeJson(
        'package.json',
        {
            name: 'hardhat-project',
        },
        { spaces: 2 },
    );
}

export async function createProject() {
    printAsciiLogo();

    await printWelcomeMessage();

    let packageJson: PackageJson | undefined;
    if (await fsExtra.pathExists('package.json')) {
        packageJson = await fsExtra.readJson('package.json');
    }
    const isEsm = packageJson?.type === 'module';

    const action = await getAction(isEsm);

    if (action === Action.QUIT_ACTION) {
        return;
    }

    if (isEsm && action === Action.CREATE_TYPESCRIPT_PROJECT_ACTION) {
        throw new Error(
            `Your project is an ESM project (you have "type": "module" set in your package.json) and you are trying to initialize a TypeScript project. This is not supported yet.`,
        );
    }

    if (packageJson === undefined) {
        await createPackageJson();
    }

    if (action === Action.CREATE_EMPTY_HARDHAT_CONFIG_ACTION) {
        await writeEmptyHardhatConfig(isEsm);
        console.log(`${picocolors.cyan(`Config file created`)}`);

        if (!isInstalled(HARDHAT_PACKAGE_NAME)) {
            console.log('');
            console.log(`You need to install @parity/hardhat-polkadot locally to use it. Please run:`);
            const cmd = await getRecommendedDependenciesInstallationCommand({
                [HARDHAT_PACKAGE_NAME]: `^${(await getPackageJson()).version}`,
            });

            console.log('');
            console.log(cmd.join(' '));
            console.log('');
        }

        return;
    }

    let responses: {
        projectRoot: string;
        shouldAddGitIgnore: boolean;
    };

    const useDefaultPromptResponses =
        process.env.HARDHAT_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS !== undefined ||
        process.env.HARDHAT_CREATE_TYPESCRIPT_PROJECT_WITH_DEFAULTS !== undefined ||
        process.env.HARDHAT_CREATE_TYPESCRIPT_VIEM_PROJECT_WITH_DEFAULTS !== undefined;

    if (useDefaultPromptResponses) {
        responses = {
            projectRoot: process.cwd(),
            shouldAddGitIgnore: true,
        };
    } else {
        try {
            responses = await confirmProjectCreation();
        } catch (e) {
            if (e === '') {
                return;
            }

            throw e;
        }
    }

    const { projectRoot, shouldAddGitIgnore } = responses;

    if (shouldAddGitIgnore) {
        await addGitIgnore(projectRoot);
    }

    await copySampleProject(projectRoot, action, isEsm);

    let shouldShowInstallationInstructions = true;

    if (await canInstallRecommendedDeps()) {
        const dependencies = await getDependencies(action);

        const recommendedDeps = Object.keys(dependencies);

        const dependenciesToInstall = fromEntries(Object.entries(dependencies).filter(([name]) => !isInstalled(name)));

        const installedRecommendedDeps = recommendedDeps.filter(isInstalled);
        const installedExceptHardhat = installedRecommendedDeps.filter((name) => name !== HARDHAT_PACKAGE_NAME);

        if (installedRecommendedDeps.length === recommendedDeps.length) {
            shouldShowInstallationInstructions = false;
        } else if (installedExceptHardhat.length === 0) {
            const shouldInstall =
                useDefaultPromptResponses ||
                (await confirmRecommendedDepsInstallation(dependenciesToInstall, await getProjectPackageManager()));
            if (shouldInstall) {
                const installed = await installRecommendedDependencies(dependenciesToInstall);

                if (!installed) {
                    console.warn(picocolors.red("Failed to install the sample project's dependencies"));
                }

                shouldShowInstallationInstructions = !installed;
            }
        }
    }

    if (shouldShowInstallationInstructions) {
        console.log(``);
        await printRecommendedDepsInstallationInstructions(action);
    }

    console.log(`\n${picocolors.cyan('Project created')}`);
    console.log();
    console.log('See the README.md file for some example tasks you can run');
    console.log();
}

async function canInstallRecommendedDeps() {
    return fsExtra.pathExists('package.json');
}

function isInstalled(dep: string) {
    const packageJson = fsExtra.readJSONSync('package.json');

    const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.optionalDependencies,
    };

    return dep in allDependencies;
}

async function isYarnProject() {
    return fsExtra.pathExists('yarn.lock');
}

async function isPnpmProject() {
    return fsExtra.pathExists('pnpm-lock.yaml');
}

async function getProjectPackageManager(): Promise<PackageManager> {
    if (await isYarnProject()) return 'yarn';
    if (await isPnpmProject()) return 'pnpm';
    return 'npm';
}

async function doesNpmAutoInstallPeerDependencies() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('child_process');
    try {
        const version: string = execSync('npm --version').toString();
        return parseInt(version.split('.')[0], 10) >= 7;
    } catch (_) {
        return false;
    }
}

async function installRecommendedDependencies(dependencies: Dependencies) {
    console.log('');

    const installCmd = await getRecommendedDependenciesInstallationCommand(dependencies);
    return installDependencies(installCmd[0], installCmd.slice(1));
}

async function installDependencies(packageManager: string, args: string[]): Promise<boolean> {
    const { spawn } = await import('child_process');

    console.log(`${packageManager} ${args.join(' ')}`);

    const childProcess = spawn(packageManager, args, {
        stdio: 'inherit',
        shell: true,
    });

    return new Promise((resolve, reject) => {
        childProcess.once('close', (status) => {
            childProcess.removeAllListeners('error');

            if (status === 0) {
                resolve(true);
                return;
            }

            reject(false);
        });

        childProcess.once('error', (_status) => {
            childProcess.removeAllListeners('close');
            reject(false);
        });
    });
}

async function getRecommendedDependenciesInstallationCommand(dependencies: Dependencies): Promise<string[]> {
    const deps = Object.entries(dependencies).map(([name, version]) => `"${name}@${version}"`);

    if (await isYarnProject()) {
        return ['yarn', 'add', '--dev', ...deps];
    }

    if (await isPnpmProject()) {
        return ['pnpm', 'add', '-D', ...deps];
    }

    return ['npm', 'install', '--save-dev', ...deps];
}

async function getDependencies(projectType: SampleProjectTypeCreationAction): Promise<Dependencies> {
    const shouldInstallPeerDependencies =
        (await isYarnProject()) || (await isPnpmProject()) || !(await doesNpmAutoInstallPeerDependencies());

    const shouldInstallTypescriptDependencies =
        projectType === Action.CREATE_TYPESCRIPT_PROJECT_ACTION ||
        projectType === Action.CREATE_TYPESCRIPT_VIEM_PROJECT_ACTION;

    const shouldInstallTypescriptPeerDependencies =
        shouldInstallTypescriptDependencies && shouldInstallPeerDependencies;

    const commonDependencies: Dependencies = {
        [HARDHAT_PACKAGE_NAME]: `^${(await getPackageJson()).version}`,
        ...PROJECT_DEPENDENCIES,
        ...(shouldInstallPeerDependencies ? PEER_DEPENDENCIES : {}),
        ...(shouldInstallTypescriptDependencies ? TYPESCRIPT_DEPENDENCIES : {}),
        ...(shouldInstallTypescriptPeerDependencies ? TYPESCRIPT_PEER_DEPENDENCIES : {}),
    };

    // At the moment, the default toolbox is the ethers based toolbox
    const shouldInstallDefaultToolbox = projectType !== Action.CREATE_TYPESCRIPT_VIEM_PROJECT_ACTION;

    const ethersToolboxDependencies: Dependencies = {
        ...ETHERS_PROJECT_DEPENDENCIES,
        ...(shouldInstallPeerDependencies ? ETHERS_PEER_DEPENDENCIES : {}),
        ...(shouldInstallTypescriptPeerDependencies ? TYPESCRIPT_ETHERS_PEER_DEPENDENCIES : {}),
    };

    const viemToolboxDependencies: Dependencies = {
        ...(shouldInstallPeerDependencies ? VIEM_PEER_DEPENDENCIES : {}),
        ...(shouldInstallTypescriptPeerDependencies ? TYPESCRIPT_VIEM_PEER_DEPENDENCIES : {}),
    };

    const toolboxDependencies: Dependencies = shouldInstallDefaultToolbox
        ? ethersToolboxDependencies
        : viemToolboxDependencies;

    return {
        ...commonDependencies,
        ...toolboxDependencies,
    };
}
