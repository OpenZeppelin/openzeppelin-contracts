const { subtask } = require('hardhat/config');
const { TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS } = require('hardhat/builtin-tasks/task-names');

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS)
  .setAction((_, __, runSuper) => runSuper().then(paths => paths.filter(path => !path.endsWith('.t.sol'))));
