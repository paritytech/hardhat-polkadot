import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { compile, resolveInputs } from '@parity/revive';
import type { SolcOutput } from '@parity/revive';
import { CompilerInput } from 'hardhat/types';

const exec = promisify(execCb)

export async function compileWithNpm(input: CompilerInput): Promise<SolcOutput> {
    const sources = resolveInputs(input.sources)

    const out = compile(sources)

    return out
}
