import findup from "find-up"
import fsExtra from "fs-extra"
import path from "path"

export interface PackageJson {
    name: string
    version: string
    type?: "commonjs" | "module"
    engines: {
        node: string
    }
}

function findClosestPackageJson(file: string): string | undefined {
    return findup.sync("package.json", { cwd: path.dirname(file) })
}

export async function getWrapperVersion(): Promise<string> {
    const packageJsonPath = findClosestPackageJson(__filename)
    if (packageJsonPath !== undefined && packageJsonPath !== "") {
        const packageJson: PackageJson = await fsExtra.readJSON(packageJsonPath)
        return packageJson.version
    }
    return ""
}
