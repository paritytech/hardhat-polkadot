#!/usr/bin/env node
import picocolors from "picocolors"

import { createProject } from "./project-creation"
import { portProject } from "./port-project"

async function main() {
    try {
        const args = process.argv.slice(2)
        const taskName = args[0]

        // Check for -y flag
        const hasYesFlag = args.includes("-y") || args.includes("--yes")

        // Create a new Hardhat project
        if (taskName === "init") {
            // If -y flag is present, set environment variable for default TypeScript project
            if (hasYesFlag) {
                process.env.HARDHAT_CREATE_TYPESCRIPT_PROJECT_WITH_DEFAULTS = "true"
            }
            return await createNewProject()
        } else if (taskName === "port") {
            // Fetch & validate args
            const projectDir = args[1]
            if (!projectDir) {
                console.error(picocolors.red("Error") + ": No project path provided")
                console.error("Expected " + picocolors.bold("hardhat-polkadot port <dir>"))
                process.exit(1)
            }

            // Port project in provided directory
            return portProject(projectDir)
        }
    } catch (e) {
        console.log(e)
    }
}

async function createNewProject() {
    if (
        process.stdout.isTTY === true ||
        process.env.HARDHAT_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS !== undefined ||
        process.env.HARDHAT_CREATE_TYPESCRIPT_PROJECT_WITH_DEFAULTS !== undefined ||
        process.env.HARDHAT_CREATE_TYPESCRIPT_VIEM_PROJECT_WITH_DEFAULTS !== undefined
    ) {
        await createProject()
        return
    }
}

main()
    .then(() => process.exit(process.exitCode))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
