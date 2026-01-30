import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { HardhatRuntimeEnvironment } from 'hardhat/types/hre';

import { transpile } from '@openzeppelin/upgrade-safe-transpiler/dist/index.js';
import { findAlreadyInitializable } from '@openzeppelin/upgrade-safe-transpiler/dist/find-already-initializable.js';

interface TranspileOptions {
  initializablePath?: string;
  exclude?: string[];
  publicInitializers?: string[];
  solcVersion?: string;
  skipWithInit?: boolean;
  namespaced?: boolean;
  namespaceExclude?: string[];
  peerProject?: string;
}

const options: TranspileOptions = {
  initializablePath: 'project/contracts/proxy/utils/Initializable.sol',
  exclude: [
    'project/contracts-exposed/**/*',
    'project/contracts/mocks/**/*Proxy*.sol',
    'project/contracts/proxy/**/*Proxy*.sol',
    'project/contracts/proxy/beacon/UpgradeableBeacon.sol',
  ],
  publicInitializers: [
    'project/contracts/access/manager/AccessManager.sol',
    'project/contracts/finance/VestingWallet.sol',
    'project/contracts/governance/TimelockController.sol',
    'project/contracts/metatx/ERC2771Forwarder.sol',
  ],
  namespaced: true,
  namespaceExclude: ['project/contracts/mocks/**/*'],
  peerProject: '@openzeppelin/',
};

export default async function (taskArguments: TranspileOptions = {}, hre: HardhatRuntimeEnvironment) {
  // TODO Use taskArguments to override options

  // Clean compilation (should result in a single build info)
  await hre.tasks.getTask('clean').run();
  await hre.tasks.getTask('compile').run({ noTests: true });

  const [buildId, ...rest] = await hre.artifacts.getAllBuildInfoIds();
  assert(buildId && rest.length == 0, 'No build info ids found');

  // Load build info
  const { input, solcVersion } = await hre.artifacts
    .getBuildInfoPath(buildId)
    .then(file => fs.readFile(file!, 'utf-8'))
    .then(JSON.parse);
  const { output } = await hre.artifacts
    .getBuildInfoOutputPath(buildId)
    .then(file => fs.readFile(file!, 'utf-8'))
    .then(JSON.parse);

  // Run transpilation on the first source folder
  const transpiled = await transpile(
    input,
    output,
    { root: hre.config.paths.root, sources: hre.config.paths.sources.solidity.at(0)! },
    { ...options, solcVersion },
  );

  // Write transpiled files to disk
  await Promise.all(
    transpiled.map(async t => {
      const outputPath = path.join(hre.config.paths.root, t.path.replace(/^project\//, ''));
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, t.source);
    }),
  );

  // Delete originals files
  const keep = new Set(
    ([] as string[])
      .concat(
        transpiled.map(t => t.path),
        findAlreadyInitializable(output, options.initializablePath),
      )
      .map(p => path.join(hre.config.paths.root, p.replace(/^project\//, ''))),
  );
  await Promise.all(
    Object.keys(output.sources)
      .map(s => path.join(hre.config.paths.root, s.replace(/^project\//, '')))
      .filter(p => !keep.has(p))
      .map(p => fs.unlink(p).catch(() => {})),
  );
}
