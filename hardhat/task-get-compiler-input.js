// adds storageLayout to solc outputSelection, necessary for storage gaps

const { internalTask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT } = require('hardhat/builtin-tasks/task-names');

internalTask(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT, async (args, bre, runSuper) => {
  const input = await runSuper();
  input.settings.outputSelection['*']['*'].push('storageLayout');
  return input;
});
