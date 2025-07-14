import type { Dispatcher } from "undici";

import fsExtra from "fs-extra";
import path from "path";

import { getWrapperVersion } from "./packageInfo";
import { shouldUseProxy } from "./proxy";
import axios from "axios";
import { CompilerBuild, CompilerList, CompilerName, CompilerPlatform } from "./downloader";

const TEMP_FILE_PREFIX = "tmp-";

function resolveTempFileName(filePath: string): string {
    const { dir, ext, name } = path.parse(filePath);

    return path.format({
        dir,
        ext,
        name: `${TEMP_FILE_PREFIX}${name}`,
    });
}

export async function download(
    url: string,
    filePath: string,
    name: CompilerName,
    platform: CompilerPlatform,
    timeoutMillis = 10000,
) {
    const { getGlobalDispatcher, ProxyAgent } = await import("undici");

    let dispatcher: Dispatcher;
    if (process.env.http_proxy !== undefined && shouldUseProxy(url)) {
        dispatcher = new ProxyAgent(process.env.http_proxy);
    } else {
        dispatcher = getGlobalDispatcher();
    }

    const response = await axios.get('https://api.github.com/repos/paritytech/revive/releases', {
        timeout: timeoutMillis
    });

    const releases = response.data;

    let releaseInfo: { [version: string]: string } = {};

    let builds: CompilerBuild[] = [];

    if (Array.isArray(response) && response.length > 0) {
        const filteredReleases = releases.filter((r: any) => !r.prerelease);

        for (const release of filteredReleases) {
            const commit = (release.target_commitish as string).slice(0, 6);
            const path = `${name}+commit.${commit}`;
            const version = (release.tag_name as string).slice(1);
            const build = commit;
            const longVersion = `${version}+commit.${commit}.llvm-18.1.8`;
            const asset = Array(release.assets).find(a => a.name == name);
            const sha256 = (asset.digest as string).slice(7);
            builds.push({
                name,
                path,
                version,
                build,
                longVersion,
                sha256,
                platform
            })
            releaseInfo[release.tag_name] = path;
        }
    }

    const list: CompilerList = {
        builds,
        releases: releaseInfo,
        latestRelease: releases[0].tag_name
    }

    const tmpFilePath = resolveTempFileName(filePath);
    await fsExtra.ensureDir(path.dirname(filePath));

    await fsExtra.writeFile(tmpFilePath, JSON.stringify(list), "utf-8");
    return fsExtra.move(tmpFilePath, filePath, { overwrite: true });
}
