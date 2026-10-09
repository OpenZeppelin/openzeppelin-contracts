import type { SolidityHooks } from 'hardhat/types/hooks';
import fs from 'node:fs';
import path from 'node:path';
import { compileYul } from '../internal/compile.ts';

const isYul = (file: string) => file.endsWith('.yul');

// Hardhat only discovers `.sol` files. This hook compiles the `.yul` files found in the sources directories (or
// explicitly passed to `hardhat build`) alongside them, and emits regular artifacts at `artifacts/<sourceName>/`.
export default async (): Promise<Partial<SolidityHooks>> => ({
  build: async (context, rootFilePaths, options, next) => {
    // Yul files are removed from the roots, so the Solidity build system doesn't try to parse them.
    const result = await next(
      context,
      rootFilePaths.filter(file => !isYul(file)),
      options,
    );

    if (context.solidity.isSuccessfulBuildResult(result) && options?.scope !== 'tests') {
      const { root, artifacts, sources } = context.config.paths;

      // Discover all Yul files in the sources directories and the root file paths.
      // Add any Yul files explicitly passed to the build via rootFilePaths.
      const yulFiles = new Set([
        ...sources.solidity
          .filter(dir => fs.existsSync(dir))
          .flatMap(dir =>
            fs
              .readdirSync(dir, { recursive: true, encoding: 'utf8' })
              .filter(isYul)
              .map(file => path.join(dir, file)),
          ),
        ...rootFilePaths.filter(isYul),
      ]);

      for (const file of yulFiles) {
        const sourceName = path.relative(root, file).split(path.sep).join('/');
        const outDir = path.join(artifacts, sourceName);
        fs.mkdirSync(outDir, { recursive: true });
        for (const { contractName, bytecode, deployedBytecode } of await compileYul(context, sourceName)) {
          const artifact = {
            _format: 'hh3-artifact-1',
            contractName,
            sourceName,
            abi: [],
            bytecode,
            linkReferences: {},
            deployedBytecode,
            deployedLinkReferences: {},
          };
          fs.writeFileSync(path.join(outDir, `${contractName}.json`), `${JSON.stringify(artifact, null, 2)}\n`);
        }
      }
    }

    return result;
  },
});
