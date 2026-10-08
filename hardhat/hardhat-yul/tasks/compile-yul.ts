import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { TaskArguments } from 'hardhat/types/tasks';
import fs from 'node:fs';
import path from 'node:path';
import { compileYul } from '../internal/compile.ts';

// Compiles every `contracts/**/*.yul` object and writes to `artifacts/yul/<name>.json`
export default async function compileYulTask(_args: TaskArguments, hre: HardhatRuntimeEnvironment) {
  const { root, artifacts } = hre.config.paths;
  const outDir = path.join(artifacts, 'yul');

  const sources = fs
    .readdirSync(path.join(root, 'contracts'), { recursive: true })
    .filter(file => typeof file === 'string' && file.endsWith('.yul'))
    .map(file => path.join('contracts', file as string));

  if (sources.length === 0) return;

  fs.mkdirSync(outDir, { recursive: true });

  for (const sourceName of sources) {
    const { bytecode, deployedBytecode } = await compileYul(hre, sourceName);
    const artifact = path.join(outDir, `${path.basename(sourceName, '.yul')}.json`);
    fs.writeFileSync(artifact, `${JSON.stringify({ bytecode, deployedBytecode }, null, 2)}\n`);
    console.log(`${sourceName} -> ${path.relative(root, artifact)}`);
  }
}
