import findup from 'find-up';
import fsExtra from 'fs-extra';
import path from 'path';

export function getPackageJsonPath(): string {
    return findClosestPackageJson(__filename)!;
}

export function getPackageRoot(): string {
    const packageJsonPath = getPackageJsonPath();

    return path.dirname(packageJsonPath);
}

export interface PackageJson {
    name: string;
    version: string;
    type?: 'commonjs' | 'module';
    engines: {
        node: string;
    };
}

export function findClosestPackageJson(file: string): string | undefined {
    return findup.sync('package.json', { cwd: path.dirname(file) });
}

export async function getPackageName(file: string): Promise<string> {
    const packageJsonPath = findClosestPackageJson(file);
    if (packageJsonPath !== undefined && packageJsonPath !== '') {
        const packageJson: PackageJson = await fsExtra.readJSON(packageJsonPath);
        return packageJson.name;
    }
    return '';
}

export async function getPackageJson(): Promise<PackageJson> {
    const root = getPackageRoot();
    return fsExtra.readJSON(path.join(root, 'package.json'));
}
