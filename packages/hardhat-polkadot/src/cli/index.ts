import { createProject } from './project-creation';

async function main() {
    try {
        const taskName = process.argv.slice(2)[0];

        // Create a new Hardhat project
        if (taskName === 'init') {
            return await createNewProject();
        }
    } catch (e) {
        console.log(e);
    }
}

async function createNewProject() {
    if (
        process.stdout.isTTY === true ||
        process.env.HARDHAT_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS !== undefined ||
        process.env.HARDHAT_CREATE_TYPESCRIPT_PROJECT_WITH_DEFAULTS !== undefined ||
        process.env.HARDHAT_CREATE_TYPESCRIPT_VIEM_PROJECT_WITH_DEFAULTS !== undefined
    ) {
        await createProject();
        return;
    }
}

main()
    .then(() => process.exit(process.exitCode))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
