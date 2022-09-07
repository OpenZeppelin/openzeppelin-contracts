const {
  TASK_COMPILE_SOLIDITY_CHECK_ERRORS,
} = require('hardhat/builtin-tasks/task-names');

const WARN_CODE_SIZE = '5574';
const IGNORED_WARNINGS = [WARN_CODE_SIZE];

// Emit all warnings as errors
task(TASK_COMPILE_SOLIDITY_CHECK_ERRORS, async ({ output, ...args }, _, runSuper) => {
  const errors = output.errors
    ?.filter(e => !IGNORED_WARNINGS.includes(e.errorCode))
    .map(e => ({ ...e, severity: 'error' }));

  return runSuper({
    output: { ...output, errors },
    ...args,
  });
});


