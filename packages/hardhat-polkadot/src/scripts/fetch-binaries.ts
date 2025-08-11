import { execSync } from 'node:child_process';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

const repo = process.env.HARDHAT_POLKADOT_BIN_REPO ?? 'paritytech/hardhat-polkadot';
const tag = process.env.HARDHAT_POLKADOT_BIN_TAG ?? 'nodes-latest';
const baseUrl = process.env.HARDHAT_POLKADOT_BIN_BASEURL ?? `https://github.com/${repo}/releases/download/${tag}`;

const osMap: Record<NodeJS.Platform, 'darwin' | 'linux' | 'win32' | undefined> = {
  aix: undefined,
  android: undefined,
  darwin: 'darwin',
  freebsd: undefined,
  haiku: undefined,
  linux: 'linux',
  openbsd: undefined,
  sunos: undefined,
  win32: 'win32',
  cygwin: undefined,
  netbsd: undefined
} as const;

const archMap: Record<string, 'x64' | 'arm64' | undefined> = {
  x64: 'x64',
  amd64: 'x64',
  arm64: 'arm64',
  aarch64: 'arm64'
};

const osTag = osMap[process.platform];
const archTag = archMap[process.arch] ?? archMap[process.env.PROCESSOR_ARCHITECTURE ?? ''];
const ext = osTag === 'win32' ? '.exe' : '';

if (!osTag || !archTag) {
  // No-op for unsupported platforms
  console.error(`Unsupported platform: ${process.platform} ${process.arch}`);
  process.exit(0);
}

const vendorDir = join(__dirname, '..', '..', 'vendor');
mkdirSync(vendorDir, { recursive: true });

function download(name: string): void {
  const out = join(vendorDir, name + ext);
  const urlArch = `${baseUrl}/${name}-${osTag}-${archTag}${ext}`;
  const urlOs = `${baseUrl}/${name}-${osTag}${ext}`;
  try {
    execSync(`curl -fL ${urlArch} -o ${out}`, { stdio: 'inherit' });
  } catch {
    execSync(`curl -fL ${urlOs} -o ${out}`, { stdio: 'inherit' });
  }
  chmodSync(out, 0o755);
}

download('revive-dev-node');
download('eth-rpc');

