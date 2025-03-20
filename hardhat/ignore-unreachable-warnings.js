// Warnings about unreachable code are emitted with a source location that corresponds to the unreachable code.
// We have some testing contracts that purposely cause unreachable code, but said code is in the library contracts, and
// with hardhat-ignore-warnings we are not able to selectively ignore them without potentially ignoring relevant
// warnings that we don't want to miss.
// Thus, we need to handle these warnings separately. We force Hardhat to compile them in a separate compilation job and
// then ignore the warnings about unreachable code coming from that compilation job.

const { task } = require('hardhat/config');
const {
  TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE,
  TASK_COMPILE_SOLIDITY_COMPILE,
} = require('hardhat/builtin-tasks/task-names');

const marker = Symbol('unreachable');
const markedCache = new WeakMap();

task(TASK_COMPILE_SOLIDITY_GET_COMPILATION_JOB_FOR_FILE, async (params, _, runSuper) => {
  const job = await runSuper(params);
  // If the file is in the unreachable directory, we make a copy of the config and mark it, which will cause it to get
  // compiled separately (along with the other marked files).
  if (params.file.sourceName.startsWith('contracts/mocks/') && /\bunreachable\b/.test(params.file.sourceName)) {
    const originalConfig = job.solidityConfig;
    let markedConfig = markedCache.get(originalConfig);
    if (markedConfig === undefined) {
      markedConfig = { ...originalConfig, [marker]: true };
      markedCache.set(originalConfig, markedConfig);
    }
    job.solidityConfig = markedConfig;
  }
  return job;
});

const W_UNREACHABLE_CODE = '5740';

task(TASK_COMPILE_SOLIDITY_COMPILE, async (params, _, runSuper) => {
  const marked = params.compilationJob.solidityConfig[marker];
  const result = await runSuper(params);
  if (marked) {
    result.output = {
      ...result.output,
      errors: result.output.errors?.filter(e => e.severity !== 'warning' || e.errorCode !== W_UNREACHABLE_CODE),
    };
  }
  return result;
});
