import path from 'path';
import micromatch from 'micromatch';

import type { SolcConfig } from 'hardhat/types/config';
import type { SolidityHooks, HookContext } from 'hardhat/types/hooks';
import type {
  BuildOptions,
  CompilationJob,
  CompilerInput,
  CompilerOutput,
  CompilerOutputError,
  EmitArtifactsResult,
  ResolvedFile,
  RunCompilationJobResult,
} from 'hardhat/types/solidity';

import type {} from '../type-extensions';

import { getExposed, getExposedPath, writeExposed } from '../core';

export default async (): Promise<Partial<SolidityHooks>> => ({
  async invokeSolc(
    context: HookContext,
    compiler: RunCompilationJobResult['compiler'],
    solcInput: CompilerInput,
    solcConfig: SolcConfig,
    next: (
      nextContext: HookContext,
      nextCompiler: RunCompilationJobResult['compiler'],
      nextSolcInput: CompilerInput,
      nextSolcConfig: SolcConfig,
    ) => Promise<CompilerOutput>,
  ): Promise<CompilerOutput> {
    // Precompilation
    const output: CompilerOutput = await next(context, compiler, solcInput, {
      ...solcConfig,
      settings: {
        ...solcConfig.settings,
        optimizer: { enabled: false },
        outputSelection: { '*': { '': ['ast'] } },
      },
    });

    // If precompilation succeeded, generate exposed files
    if (!output.errors?.some((e: CompilerOutputError) => e.severity === 'error')) {
      // Determine which files to include
      const include = (sourceName: string): boolean =>
        sourceName.startsWith('project/') &&
        context.config.exposed.include.some((p: string) =>
          micromatch.isMatch(path.relative('project/', sourceName), p),
        ) &&
        !context.config.exposed.exclude.some((p: string) =>
          micromatch.isMatch(path.relative('project/', sourceName), p),
        );

      // Generate exposed files
      const exposed = getExposed(output, include, context.config);

      // Write exposed files to disk and add them to the compilation input
      await writeExposed(exposed);
      for (const [fsPath, content] of exposed) {
        const relativePath = path.join('project', path.relative(context.config.paths.root, fsPath));
        solcInput.sources[relativePath] = { content };
      }
    }

    // Full compilation
    return await next(context, compiler, solcInput, solcConfig);
  },

  emitArtifacts(
    context: HookContext,
    compilationJob: CompilationJob,
    compilerOutput: CompilerOutput,
    options: BuildOptions,
    next: (
      nextContext: HookContext,
      nextCompilationJob: CompilationJob,
      nextCompilerOutput: CompilerOutput,
      nextOptions: BuildOptions,
    ) => Promise<EmitArtifactsResult>,
  ): Promise<EmitArtifactsResult> {

    for (const [root, value] of compilationJob.dependencyGraph.getRoots().entries()) {
      const exposedPath = path.join(context.config.exposed.outDir, root);
      const fsPath = path.join(context.config.paths.root, exposedPath);
      const inputSourceName = path.join('project', exposedPath);

      if (compilerOutput.contracts?.[inputSourceName]) {
        (compilationJob.dependencyGraph as any).addRootFile(exposedPath, {
          ...value,
          inputSourceName,
          fsPath,
          content: { text: '', importPaths: '', versionPragmas: [ '>=0.6.0' ] },
        });
      }
    }

    return next(context, compilationJob, compilerOutput, options);
  }
});
