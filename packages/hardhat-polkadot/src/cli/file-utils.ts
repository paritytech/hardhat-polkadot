import fs from "fs"
import chalk from "chalk"
import fsPromises from "fs/promises"
import path from "path"
import { structuredPatch } from "diff"

import { getRecommendedGitIgnore } from "../project-structure"

/**
 * Returns an array of files (not dirs) that match a condition.
 *
 * @param absolutePathToDir A directory. If it doesn't exist `[]` is returned.
 * @param matches A function to filter files (not directories)
 * @returns An array of absolute paths. Each file has its true case, except
 *  for the initial absolutePathToDir part, which preserves the given casing.
 *  No order is guaranteed.
 */
export async function getAllFilesMatching(
    absolutePathToDir: string,
    matches?: (absolutePathToFile: string) => boolean,
): Promise<string[]> {
    const dir = await readdir(absolutePathToDir)

    const results = await Promise.all(
        dir.map(async (file) => {
            const absolutePathToFile = path.join(absolutePathToDir, file)
            const stats = await fsPromises.stat(absolutePathToFile)
            if (stats.isDirectory()) {
                const files = await getAllFilesMatching(absolutePathToFile, matches)
                return files.flat()
            } else if (matches === undefined || matches(absolutePathToFile)) {
                return absolutePathToFile
            } else {
                return []
            }
        }),
    )

    return results.flat()
}

async function readdir(absolutePathToDir: string) {
    try {
        return await fsPromises.readdir(absolutePathToDir)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        if (e.code === "ENOENT") {
            return []
        }

        if (e.code === "ENOTDIR") {
            throw new Error(absolutePathToDir, e)
        }

        throw new Error(e.message, e)
    }
}

/**
 * Add or merge existing `.gitignore` with recommended content.
 * Generates the new content without actually writing it to file.
 *
 * @returns a tuple of [gitIgnorePath, originalContent, newContent]
 */
export async function addOrMergeGitIgnore(projectRoot: string): Promise<[string, string, string]> {
    // Read existing & recommended `.gitignore` files
    const gitIgnorePath = path.join(projectRoot, ".gitignore")
    const originalGitIgnore = fs.existsSync(gitIgnorePath)
        ? fs.readFileSync(gitIgnorePath, "utf8")
        : ""
    let newContent = await getRecommendedGitIgnore()

    // Filter out duplicate .gitignore entries
    const existingLines = originalGitIgnore.split(/\r?\n/)
    const newLines = newContent.split(/\r?\n/)
    let keepLines = newLines.filter(
        (v) =>
            v == "" ||
            v.startsWith("#") ||
            !(
                existingLines.includes(v) ||
                (v.startsWith("/") && // Handle multiple variants of directory entries
                    (existingLines.includes(v.slice(1)) ||
                        existingLines.includes(v.slice(1) + "/")))
            ),
    )
    // Remove comments for completely removed sections & format whitespace
    keepLines = keepLines.filter((v, i) => !(v.startsWith("#") && keepLines[i + 1] === ""))
    newContent = keepLines
        .join("\n")
        .replace(/\n{2,}/g, "\n\n")
        .trim()

    // Merge old & new content
    let newGitIgnore = originalGitIgnore
    if (originalGitIgnore != "") {
        newGitIgnore = newGitIgnore.trimEnd() + "\n\n"
    }
    if (keepLines.length > 0) {
        newGitIgnore += newContent + "\n"
    }

    return [gitIgnorePath, originalGitIgnore, newGitIgnore]
}

/**
 * Prints diff between `before` and `after` versions of a file
 *
 * @param filePath path to the file— only used for printing header
 * @param before string of the old file content
 * @param after string of the new file content
 */
export function printDiff(filePath: string, before: string, after: string) {
    if (before === after) {
        console.log(chalk.bold.yellow(`No changes in ${filePath}`))
        return
    }
    console.log(chalk.bold.hex("#ED3194")("Changes in"), chalk.bold(filePath))

    // Create structured diff and print color-formatted output
    const spatch = structuredPatch(filePath, filePath, before, after, "", "", { context: 0 })
    for (const hunk of spatch.hunks) {
        console.log("@@ line ", hunk.oldStart)
        for (const [_, l] of hunk.lines.entries()) {
            const text = l.startsWith("+") ? chalk.green(l) : chalk.red(l)
            console.log(text)
        }
    }
}
