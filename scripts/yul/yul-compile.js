import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = path.join(import.meta.dirname, '..', '..');
const yulDir = import.meta.dirname;
const outDir = path.join('artifacts', 'yul');
const FORGE = process.env.FORGE || 'forge';

// Whether a `forge` binary is available.
export function canCompileYul() {
  try {
    execFileSync(FORGE, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Compile every scripts/yul/*.yul into artifacts/yul/
export function compileAllYul() {
  return fs
    .readdirSync(yulDir)
    .filter(file => file.endsWith('.yul'))
    .map(file => {
      execFileSync(FORGE, ['build', path.join(yulDir, file), '--out', outDir], { cwd: repoRoot, stdio: 'pipe' });
      return path.basename(file, '.yul');
    });
}

// Read a compiled object's creation and deployed bytecode from artifacts/yul/
export function readYulBytecode(name) {
  const artifact = path.join(repoRoot, outDir, `${name}.yul`, `${name}.json`);
  const { bytecode, deployedBytecode } = JSON.parse(fs.readFileSync(artifact, 'utf8'));
  return { creation: bytecode.object.toLowerCase(), deployed: deployedBytecode.object.toLowerCase() };
}
