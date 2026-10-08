import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import type { SolidityBuildInfo } from 'hardhat/types/solidity';
import { readFile } from 'node:fs/promises';

export interface YulBytecode {
  bytecode: string;
  deployedBytecode: string;
}

// Compile a Yul object with the solc resolved by Hardhat (courtesy from the Hardhat team).
export async function compileYul(hre: HardhatRuntimeEnvironment, sourceName: string): Promise<YulBytecode> {
  const { version, settings } = hre.config.solidity.profiles.default.compilers[0];

  const input = {
    language: 'Yul',
    sources: { [sourceName]: { content: await readFile(sourceName, 'utf8') } },
    settings: {
      optimizer: settings.optimizer,
      evmVersion: settings.evmVersion,
      outputSelection: { '*': { '*': ['evm.bytecode.object', 'evm.deployedBytecode.object'] } },
    },
  };

  // `hre.solidity.compileBuildInfo` downloads (or reuses from cache) the requested solc version
  const output = await hre.solidity.compileBuildInfo({ solcVersion: version, input } as unknown as SolidityBuildInfo, {
    quiet: true,
  });

  const errors = output.errors?.filter(e => e.severity === 'error') ?? [];
  if (errors.length > 0) {
    throw new Error(errors.map(e => e.formattedMessage).join('\n'));
  }

  const evm = Object.values(output.contracts?.[sourceName] ?? {})[0]?.evm;
  if (!evm?.bytecode?.object || !evm?.deployedBytecode?.object) {
    throw new Error(`No bytecode produced for ${sourceName}`);
  }
  return { bytecode: `0x${evm.bytecode.object}`, deployedBytecode: `0x${evm.deployedBytecode.object}` };
}
