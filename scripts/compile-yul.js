import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const repoRoot = path.join(import.meta.dirname, '..');
const srcDir = path.join(repoRoot, 'contracts');
const artifactsDir = path.join(repoRoot, 'artifacts');
const buildInfoDir = path.join(repoRoot, 'cache_forge', 'build-info');
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

// Artifacts directory of a .yul file, mirroring the source hierarchy (e.g. artifacts/contracts/utils/Foo.yul/)
function artifactDir(file) {
  return path.join(artifactsDir, path.relative(repoRoot, path.resolve(repoRoot, file)));
}

// Compile a single .yul file (absolute or relative to the repo root) into its artifacts directory
export function compileYul(file) {
  execFileSync(
    FORGE,
    [
      'build',
      path.resolve(repoRoot, file),
      '--out',
      path.dirname(artifactDir(file)),
      '--build-info',
      '--build-info-path',
      buildInfoDir,
    ],
    { cwd: repoRoot, stdio: 'pipe' },
  );
  return path.basename(file, '.yul');
}

// Compile every contracts/**/*.yul into its artifacts directory
export function compileAllYul() {
  return fs
    .readdirSync(srcDir, { recursive: true })
    .filter(file => file.endsWith('.yul'))
    .map(file => compileYul(path.join(srcDir, file)));
}

// Compile a .yul file and read the creation and deployed bytecode of one of its objects (`file[:object]`)
export function getYulBytecode(name) {
  const [file, contract] = name.split(':');
  compileYul(file);
  const { bytecode, deployedBytecode } = JSON.parse(
    fs.readFileSync(path.join(artifactDir(file), `${contract ?? path.basename(file, '.yul')}.json`), 'utf8'),
  );
  return { creation: bytecode.object.toLowerCase(), deployed: deployedBytecode.object.toLowerCase() };
}
