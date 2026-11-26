import type { SolidityHooks } from 'hardhat/types/hooks';
import type { Compiler, CompilerInput, CompilerOutput } from 'hardhat/types/solidity';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

// Hardhat supports native solc binaries through the `path` field of the compiler config, but fails to parse the
// `--version` output of prerelease builds (e.g. `0.9.0-pre.1+commit.91c99213`). This hook handles local native
// binaries itself, so prerelease compilers can be used before Hardhat supports them.
// See https://github.com/NomicFoundation/hardhat/pull/8887
export default async (): Promise<Partial<SolidityHooks>> => ({
  getCompiler: async (context, compilerConfig, next) => {
    if ((compilerConfig.type ?? 'solc') !== 'solc' || compilerConfig.path === undefined) {
      return next(context, compilerConfig);
    }

    const compilerPath: string = compilerConfig.path;
    const { stdout } = await promisify(execFile)(compilerPath, ['--version']);
    const longVersion = stdout.match(/\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?\+commit\.[0-9a-f]+/)?.[0];
    if (longVersion === undefined) {
      throw new Error(`Failed to parse the version of ${compilerPath}: ${stdout}`);
    }

    return {
      version: compilerConfig.version,
      longVersion,
      compilerPath,
      isSolcJs: false,
      compile: (input: CompilerInput) => compile(compilerPath, input),
    } satisfies Compiler;
  },
});

function compile(compilerPath: string, input: CompilerInput): Promise<CompilerOutput> {
  return new Promise((resolve, reject) => {
    const subprocess = spawn(compilerPath, ['--standard-json', '--no-import-callback']);
    const chunks: Buffer[] = [];
    subprocess.stdout.on('data', chunk => chunks.push(chunk));
    subprocess.stderr.pipe(process.stderr);
    subprocess.on('error', reject);
    subprocess.on('close', code => {
      if (code !== 0) return reject(new Error(`${compilerPath} exited with code ${code}`));
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch (error) {
        reject(error);
      }
    });
    subprocess.stdin.end(JSON.stringify(input));
  });
}
