#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const base = join(__dirname, '..', '..', 'vendor', 'revive-dev-node');
const candidate = [base, `${base}.exe`];
const bin = candidate.find((p) => existsSync(p)) ?? base;

const child = spawn(bin, process.argv.slice(2), { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 1));

