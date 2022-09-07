const {
  TASK_COMPILE_SOLIDITY_CHECK_ERRORS,
} = require('hardhat/builtin-tasks/task-names');

const WARN_CODE_SIZE = '5574';
const WARN_UNREACHABLE = '5740';
const NOT_ERROR = [WARN_CODE_SIZE, WARN_UNREACHABLE];

// Emit all warnings as errors
task(TASK_COMPILE_SOLIDITY_CHECK_ERRORS, async ({ output, ...args }, _, runSuper) => {
  const errors = output.errors?.map(e => ({
    ...e,
    severity: NOT_ERROR.includes(e.errorCode) ? e.severity : 'error',
  }));

  return runSuper({
    output: { ...output, errors },
    ...args,
  });
});


