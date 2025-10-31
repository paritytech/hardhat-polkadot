import fs from "fs"
import chalk from "chalk"
import { updatePackageJSON, updateHHConfig } from "@parity/hardhat-polkadot-migrator"

import { confirmDiff } from "./prompt"
import { addOrMergeGitIgnore, printDiff } from "./file-utils"

export async function portProject(projectDir: string, hasYesFlag: boolean) {
    try {
        // Generate migration changes across files
        const [pkgPath, pkgJSONNew, pkgJSONOld] = await updatePackageJSON(projectDir)
        const [HHConfigPath, HHConfigNew, HHConfigOld] = updateHHConfig(projectDir)
        const [gitignorePath, gIgnoreOld, gIgnoreNew] = await addOrMergeGitIgnore(projectDir)
        printDiff(pkgPath, pkgJSONOld, pkgJSONNew)
        printDiff(HHConfigPath, HHConfigOld, HHConfigNew)
        printDiff(gitignorePath, gIgnoreOld, gIgnoreNew)

        // Write changes to disk if any & user consents
        if (
            (HHConfigOld !== HHConfigNew ||
                pkgJSONOld !== pkgJSONNew ||
                gIgnoreOld !== gIgnoreNew) &&
            (hasYesFlag || (await confirmDiff()))
        ) {
            fs.writeFileSync(pkgPath, pkgJSONNew, "utf8")
            fs.writeFileSync(HHConfigPath, HHConfigNew, "utf8")
            fs.writeFileSync(gitignorePath, gIgnoreNew, "utf8")
        }
    } catch (e) {
        console.error(chalk.red("Error") + ": Failed to port project")
        console.error(e)
        process.exit(1)
    }
}
