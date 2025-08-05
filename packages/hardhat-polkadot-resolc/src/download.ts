import fsExtra from "fs-extra"
import path from "path"

import axios from "axios"
import { execSync } from "child_process"
import { CompilerPlatform } from "hardhat/internal/solidity/compiler/downloader"
import { CompilerName, type CompilerBuild, type CompilerList } from "./types"
import { COMPILER_REPOSITORY_URL } from "./constants"

const TEMP_FILE_PREFIX = "tmp-"
const request_headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
}
if (process.env.GITHUB_TOKEN) request_headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

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
        const releasesResponse = await axios.get(url, {
            timeout: timeoutMillis,
            responseType: "json",
            headers: request_headers,
        })

        const releasesData = releasesResponse.data

        const releaseInfo: { [version: string]: string } = {}

        const builds: CompilerBuild[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredReleases = releasesData.filter((r: any) => !r.prerelease)

        /**
         * Solidity provides a list of releases with their corresponding info via the endpoint
         * https://binaries.soliditylang.org/${PLATFORM}/list.json .
         *
         * In order to keep the interfaces coherent, and since we don't have such endpoint,
         * we build the list manually here.
         */
        if (Array.isArray(filteredReleases) && filteredReleases.length > 0) {
            for (const release of filteredReleases) {
                const commit = (release.target_commitish as string).slice(0, 6)
                const path = `${name}+commit.${commit}`
                const version = (release.tag_name as string).slice(1)
                const build = commit
                const longVersion = `${version}+commit.${commit}.llvm-18.1.8`

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const asset = release.assets.find((a: any) => a.name == name)
                if (!asset) continue

                let sha256 = ""
                if (!asset.digest || asset.digest == null) {
                    const checksumResponse = await axios.get(
                        `${COMPILER_REPOSITORY_URL}v${version}/checksums.txt`,
                        {
                            timeout: timeoutMillis,
                            responseType: "text",
                        },
                    )

                    const tempFile = `./${TEMP_FILE_PREFIX}checksums.txt`
                    fsExtra.writeFileSync(tempFile, checksumResponse.data)
                    try {
                        const checksum = execSync(`grep ${name} ${tempFile}`).toString()
                        sha256 = checksum.trim().split(" ")[0]

                        fsExtra.remove(tempFile, (removeErr) => {
                            if (removeErr) console.error("Failed to delete temp file:", removeErr)
                        })
                    } catch (e) {
                        return console.error("grep failed:", e)
                    }
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
            latestRelease: releasesData[0].tag_name,
        }

        const tmpFilePath = resolveTempFileName(filePath)
        await fsExtra.ensureDir(path.dirname(filePath))

        await fsExtra.writeFile(tmpFilePath, JSON.stringify(list), "utf-8")
        return fsExtra.move(tmpFilePath, filePath, { overwrite: true })
    }
    const response = await axios.get(url, {
        timeout: timeoutMillis,
        responseType: "arraybuffer",
    })

    const tmpFilePath = resolveTempFileName(filePath)
    await fsExtra.ensureDir(path.dirname(filePath))

    await fsExtra.writeFile(tmpFilePath, Buffer.from(response.data))
    return fsExtra.move(tmpFilePath, filePath, { overwrite: true })
}
