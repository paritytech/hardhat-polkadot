import { exec as execCb } from 'child_process';
import { promisify } from 'util';
import { compile, resolveInputs } from '@parity/resolc';
import type { SolcOutput } from '@parity/resolc';
import type { CompilerInput } from 'hardhat/types';
import type { ResolcConfig } from 'src/types';

const _exec = promisify(execCb)

export async function compileWithNpm(input: CompilerInput, config: ResolcConfig): Promise<SolcOutput> {
    const sources = resolveInputs(input.sources)

    const out = compile(sources)

    return out
}
