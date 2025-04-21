import fsPromises from 'fs/promises';
import path from 'path';
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
    const dir = await readdir(absolutePathToDir);

    const results = await Promise.all(
        dir.map(async (file) => {
            const absolutePathToFile = path.join(absolutePathToDir, file);
            const stats = await fsPromises.stat(absolutePathToFile);
            if (stats.isDirectory()) {
                const files = await getAllFilesMatching(absolutePathToFile, matches);
                return files.flat();
            } else if (matches === undefined || matches(absolutePathToFile)) {
                return absolutePathToFile;
            } else {
                return [];
            }
        }),
    );

    return results.flat();
}

async function readdir(absolutePathToDir: string) {
    try {
        return await fsPromises.readdir(absolutePathToDir);
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            return [];
        }

        if (e.code === 'ENOTDIR') {
            // eslint-disable-next-line @nomicfoundation/hardhat-internal-rules/only-hardhat-error
            throw new Error(absolutePathToDir, e);
        }

        // eslint-disable-next-line @nomicfoundation/hardhat-internal-rules/only-hardhat-error
        throw new Error(e.message, e);
    }
}
