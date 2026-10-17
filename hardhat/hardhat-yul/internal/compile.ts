import type { HookContext } from 'hardhat/types/hooks';
import type { SolidityBuildInfo } from 'hardhat/types/solidity';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface YulContract {
  contractName: string;
  buildInfoId: string;
  bytecode: string;
  deployedBytecode: string;
}

// Compile a Yul source with the solc resolved by Hardhat (courtesy from the Hardhat team).
export async function compileYul(context: HookContext, sourceName: string): Promise<YulContract[]> {
  const { version, settings } = context.config.solidity.profiles.default.compilers[0];

  const input = {
    language: 'Yul',
    sources: {
      [sourceName]: { content: await readFile(path.join(context.config.paths.root, sourceName), 'utf8') },
    },
    settings: {
      optimizer: settings.optimizer,
      evmVersion: settings.evmVersion,
      outputSelection: { '*': { '*': ['evm.bytecode.object', 'evm.deployedBytecode.object'] } },
    },
  };

  // Hardhat requires every artifact to reference a build info, with an id of the form `solc-<major>_<minor>_<patch>-<hex>`
  // (the solc version is parsed from it). No build info file is written: only the id is needed.
  const buildInfoId = `solc-${version.replaceAll('.', '_')}-${createHash('sha256').update(JSON.stringify(input)).digest('hex')}`;

  // `context.solidity.compileBuildInfo` downloads (or reuses from cache) the requested solc version
  const output = await context.solidity.compileBuildInfo(
    { solcVersion: version, input } as unknown as SolidityBuildInfo,
    {
      quiet: true,
    },
  );

  const errors = output.errors?.filter(e => e.severity === 'error') ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map(e => e.formattedMessage).join('\n'));
  }

  return Object.entries(output.contracts?.[sourceName] ?? {}).map(([contractName, { evm }]) => {
    if (!evm?.bytecode?.object || !evm?.deployedBytecode?.object) {
      throw new Error(`No bytecode produced for ${sourceName}:${contractName}`);
    }
    return {
      contractName,
      buildInfoId,
      bytecode: `0x${evm.bytecode.object}`,
      deployedBytecode: `0x${evm.deployedBytecode.object}`,
    };
  });
}
