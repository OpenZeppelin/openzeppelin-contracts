const { readPreState } = require('@changesets/pre');
const { default: readChangesets } = require('@changesets/read');
const { join } = require('path');
const { version } = require(join(__dirname, '../../../package.json'));

module.exports = async ({ github, context, core }) => {
  const state = await readChangesetState();

  // Variables not in the context
  const refName = process.env.GITHUB_REF_NAME;

  // Static pre conditions
  const pendingChangesets = state.changesets.length > 0;
  const prerelease = state.preState?.mode === 'pre';
  const isMaster = refName === 'master';
  const isReleaseBranch = refName.startsWith('release-v');
  const isWorkflowDispatch = context.eventName === 'workflow_dispatch';
  const isPush = context.eventName === 'push';
  const isCurrentFinalVersion = !version.includes('-rc.');
  const isRerun = !!core.getInput('rerun');

  // Async pre conditions
  const { data: prs } = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    head: `${context.repo.owner}:merge/${refName}`,
    base: 'master',
    state: 'open',
  });

  const prBackExists = prs.length === 0;

  // Job Flags
  const shouldRunStart = isMaster && isWorkflowDispatch && !isRerun;
  const shouldRunPromote = isReleaseBranch && isWorkflowDispatch && !isRerun;
  const shouldRunChangesets = isReleaseBranch && isPush;
  const shouldRunPublish = isReleaseBranch && isPush && !pendingChangesets;
  const shouldRunMerge =
    isReleaseBranch && isPush && !prerelease && isCurrentFinalVersion && !pendingChangesets && prBackExists;

  function setOutput(key, value) {
    core.info(`State ${key} = ${value}`);
    core.setOutput(key, value);
  }

  // Jobs to trigger
  setOutput('start', shouldRunStart);
  setOutput('promote', shouldRunPromote);
  setOutput('changesets', shouldRunChangesets);
  setOutput('publish', shouldRunPublish);
  setOutput('merge', shouldRunMerge);

  // Global Variables
  setOutput('is_prerelease', prerelease);
  setOutput('version', version);
};

// From https://github.com/changesets/action/blob/v1.4.1/src/readChangesetState.ts
async function readChangesetState(cwd = process.cwd()) {
  const preState = await readPreState(cwd);
  const isInPreMode = preState !== undefined && preState.mode === 'pre';

  let changesets = await readChangesets(cwd);

  if (isInPreMode) {
    changesets = changesets.filter(x => !preState.changesets.includes(x.id));
  }

  return {
    preState: isInPreMode ? preState : undefined,
    changesets,
  };
}
