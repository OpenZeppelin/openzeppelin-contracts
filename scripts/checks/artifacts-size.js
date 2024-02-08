#!/usr/bin/env node

const path = require('path');
const { _: artifacts } = require('yargs').argv;

// Constants from EIP-3860
const MAX_CODE_SIZE = 24576;

// Get all compiled contracts from compilation artifacts
const contracts = Object.fromEntries(
  artifacts
    .map(artifact => require(path.resolve(__dirname, '../..', artifact)))
    .flatMap(buildInfo =>
      Object.entries(buildInfo.output.contracts).flatMap(([file, contracts]) =>
        Object.entries(contracts).map(([name, details]) => [
          `${file}:${name}`,
          Object.assign(details, { extra: { file, name, compilerSettings: buildInfo.input.settings } }),
        ]),
      ),
    ),
);

for (const [id, details] of Object.entries(contracts)) {
  // Skip "exposed" contracts
  if (details.extra.name.startsWith('$')) {
    continue;
  }

  // Skip (with warning) contracts that were not compiled with optimizations
  if (!details.extra.compilerSettings.optimizer.enabled) {
    console.warn(`[Warning] ${id} was compiled without optimizations. Skipped.`);
    continue;
  }

  // Check deployed bytecode length is within limits
  const { length: deployedBytecodeLength } = Buffer.from(details.evm.deployedBytecode.object, 'hex');
  if (deployedBytecodeLength > MAX_CODE_SIZE) {
    console.log('[deployedBytecode over limit]', id, deployedBytecodeLength);
    process.exitCode = 1;
  }
}
