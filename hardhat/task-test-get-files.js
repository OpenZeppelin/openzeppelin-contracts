// Ignores the proxy tests after they are removed by the transpiler

const { internalTask } = require('hardhat/config');
const { TASK_TEST_GET_TEST_FILES } = require('hardhat/builtin-tasks/task-names');

internalTask(TASK_TEST_GET_TEST_FILES)
  .setAction(async ({ testFiles }, { config }) => {
    const globAsync = require('glob');
    const path = require('path');
    const { promisify } = require('util');

    const glob = promisify(globAsync);

    if (testFiles.length !== 0) {
      return testFiles;
    }

    const proxies = await glob(path.join(config.paths.sources, 'proxy/**/*.sol'));

    return await glob(
      path.join(config.paths.tests, '**/*.js'),
      {
        ignore: proxies.length > 0
          ? []
          : [path.join(config.paths.tests, 'proxy/**/*')]
      },
    );
  });
