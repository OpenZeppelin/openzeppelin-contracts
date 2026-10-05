#!/usr/bin/env node

import { canCompileYul, compileAllYul } from './yul-compile.js';

// Compiles every scripts/yul/*.yul into artifacts/yul/ for inspection.
if (!canCompileYul()) {
  console.error('forge not found; install Foundry or set FORGE to a forge binary.');
  process.exit(1);
}

for (const name of compileAllYul()) {
  console.log(`compiled artifacts/yul/${name}.yul/`);
}
