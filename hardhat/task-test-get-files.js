// Ignores the proxy tests after they are removed by the transpiler

const { internalTask } = require('hardhat/config');
const { TASK_TEST_GET_TEST_FILES } = require('hardhat/builtin-tasks/task-names');

internalTask(TASK_TEST_GET_TEST_FILES).setAction(async ({ testFiles }, { config }) => {
  if (testFiles.length !== 0) {
    return testFiles;
  }

  const globAsync = require('glob');
  const path = require('path');
  const { promises: fs } = require('fs');
  const { promisify } = require('util');

  const glob = promisify(globAsync);

  const hasProxies = await fs
    .access(path.join(config.paths.sources, 'proxy/Proxy.sol'))
    .then(() => true)
    .catch(() => false);

  return await glob(path.join(config.paths.tests, '**/*.js'), {
    ignore: hasProxies ? [] : [path.join(config.paths.tests, 'proxy/**/*')],
  });
});
