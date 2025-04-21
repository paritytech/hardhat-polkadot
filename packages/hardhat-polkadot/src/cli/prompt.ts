import { Dependencies, PackageManager } from './types';

function createConfirmationPrompt(name: string, message: string) {
    return {
        type: 'confirm',
        name,
        message,
        initial: 'y',
        default: '(Y/n)',
        isTrue(input: string | boolean) {
            if (typeof input === 'string') {
                return input.toLowerCase() === 'y';
            }

            return input;
        },
        isFalse(input: string | boolean) {
            if (typeof input === 'string') {
                return input.toLowerCase() === 'n';
            }

            return input;
        },
        format(): string {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const that = this as any;
            const value = that.value === true ? 'y' : 'n';

            if (that.state.submitted === true) {
                return that.styles.submitted(value);
            }

            return value;
        },
    };
}

export async function confirmRecommendedDepsInstallation(
    depsToInstall: Dependencies,
    packageManager: PackageManager,
): Promise<boolean> {
    const { default: enquirer } = await import('enquirer');

    let responses: {
        shouldInstallPlugin: boolean;
    };

    try {
        responses = await enquirer.prompt<typeof responses>([
            createConfirmationPrompt(
                'shouldInstallPlugin',
                `Do you want to install this sample project's dependencies with ${packageManager} (${Object.keys(
                    depsToInstall,
                ).join(' ')})?`,
            ),
        ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        if (e === '') {
            return false;
        }

        throw e;
    }

    return responses.shouldInstallPlugin;
}

export async function confirmProjectCreation(): Promise<{
    projectRoot: string;
    shouldAddGitIgnore: boolean;
}> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const enquirer = require('enquirer');
    return enquirer.prompt([
        {
            name: 'projectRoot',
            type: 'input',
            initial: process.cwd(),
            message: 'Hardhat project root:',
        },
        createConfirmationPrompt('shouldAddGitIgnore', 'Do you want to add a .gitignore?'),
    ]);
}

export async function confirmTelemetryConsent(): Promise<boolean | undefined> {
    return confirmationPromptWithTimeout(
        'telemetryConsent',
        'Help us improve Hardhat with anonymous crash reports & basic usage data?',
    );
}

export async function confirmHHVSCodeInstallation(): Promise<boolean | undefined> {
    return confirmationPromptWithTimeout(
        'shouldInstallExtension',
        'Would you like to install the Hardhat for Visual Studio Code extension? It adds advanced editing assistance for Solidity to VSCode',
    );
}

async function confirmationPromptWithTimeout(
    name: string,
    message: string,
    timeoutMilliseconds: number = 10_000,
): Promise<boolean | undefined> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const enquirer = require('enquirer');

        const prompt = new enquirer.prompts.Confirm(createConfirmationPrompt(name, message));

        let timeout;
        const timeoutPromise = new Promise((resolve) => {
            timeout = setTimeout(resolve, timeoutMilliseconds);
        });

        const result = await Promise.race([prompt.run(), timeoutPromise]);
        clearTimeout(timeout);

        if (result === undefined) {
            await prompt.cancel();
        }

        return result;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        if (e === '') {
            return undefined;
        }

        throw e;
    }
}
