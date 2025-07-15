import fsExtra from "fs-extra"
import path from "path"

import axios from "axios"
import { exec } from "child_process"
import { CompilerName, CompilerPlatform, type CompilerBuild, type CompilerList } from "./types"

const TEMP_FILE_PREFIX = "tmp-"

function resolveTempFileName(filePath: string): string {
    const { dir, ext, name } = path.parse(filePath)

    return path.format({
        dir,
        ext,
        name: `${TEMP_FILE_PREFIX}${name}`,
    })
}

export async function download(
    url: string,
    filePath: string,
    name: CompilerName,
    platform: CompilerPlatform,
    isList = false,
    timeoutMillis = 10000,
) {
    if (isList) {
        const response = await axios.get(url, {
            timeout: timeoutMillis,
            responseType: "json",
        })

        const releases = response.data

        const releaseInfo: { [version: string]: string } = {}

        const builds: CompilerBuild[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredReleases = releases.filter((r: any) => !r.prerelease)

        if (Array.isArray(filteredReleases) && filteredReleases.length > 0) {
            for (const release of filteredReleases) {
                const commit = (release.target_commitish as string).slice(0, 6)
                const path = `${name}+commit.${commit}`
                const version = (release.tag_name as string).slice(1)
                const build = commit
                const longVersion = `${version}+commit.${commit}.llvm-18.1.8`
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const asset = release.assets.find((a: any) => a.name == name)
                let sha256 = ""
                if (!asset) {
                    continue
                } else if (!asset.digest || asset.digest == null) {
                    const checksum = await axios.get(
                        `https://github.com/paritytech/revive/releases/download/v${version}/checksums.txt`,
                        {
                            timeout: timeoutMillis,
                            responseType: "text",
                        },
                    )

                    const tempFile = "./checksums.txt"
                    fsExtra.writeFileSync(tempFile, checksum.data)
                    exec(`grep ${name} ${tempFile}`, (err, stdout) => {
                        if (err) return console.error("grep failed:", err)
                        sha256 = stdout.trim().split(" ")[0]
                    })

                    fsExtra.remove(tempFile, (removeErr) => {
                        if (removeErr) console.error("Failed to delete temp file:", removeErr)
                    })
                } else {
                    sha256 = asset.digest.slice(7)
                }
                builds.push({
                    name,
                    path,
                    version,
                    build,
                    longVersion,
                    sha256,
                    platform,
                })
                releaseInfo[release.tag_name] = path
            }
        }

        const list: CompilerList = {
            builds,
            releases: releaseInfo,
            latestRelease: releases[0].tag_name,
        }

        const tmpFilePath = resolveTempFileName(filePath)
        await fsExtra.ensureDir(path.dirname(filePath))

        await fsExtra.writeFile(tmpFilePath, JSON.stringify(list), "utf-8")
        return fsExtra.move(tmpFilePath, filePath, { overwrite: true })
    } else {
        const response = await axios.get(url, {
            timeout: timeoutMillis,
            responseType: "arraybuffer",
        })

        const tmpFilePath = resolveTempFileName(filePath)
        await fsExtra.ensureDir(path.dirname(filePath))

        await fsExtra.writeFile(tmpFilePath, Buffer.from(response.data))
        return fsExtra.move(tmpFilePath, filePath, { overwrite: true })
    }
}
