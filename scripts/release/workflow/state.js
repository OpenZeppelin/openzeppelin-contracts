const { readPreState } = require('@changesets/pre');
const { default: readChangesets } = require('@changesets/read');
const { join } = require('path');
const { version } = require(join(__dirname, '../../../package.json'));

// From https://github.com/changesets/action/blob/v1.4.1/src/readChangesetState.ts
async function readChangesetState(cwd = process.cwd()) {
  const preState = await readPreState(cwd);
  const isInPreMode = preState !== undefined && preState.mode === 'pre';

  let changesets = await readChangesets(cwd);

  if (isInPreMode) {
    const changesetsToFilter = new Set(preState.changesets);
    changesets = changesets.filter(x => !changesetsToFilter.has(x.id));
  }

  return {
    preState: isInPreMode ? preState : undefined,
    changesets,
  };
}

module.exports = async ({ github, context, core }) => {
  const state = readChangesetState();

  // Variables not in the context
  const refName = process.env.GITHUB_REF_NAME;

  // Static pre conditions
  const pendingChangesets = !!state?.changesets?.length;
  const prerelease = state.preState?.mode === 'pre';
  const isMaster = refName === 'master';
  const isReleaseBranch = refName.includes('release-v');
  const isWorkflowDispatch = context.eventName === 'workflow_dispatch';
  const isPush = context.eventName === 'push';
  const isCurrentFinalVersion = !version.includes('-rc.');

  // Async pre conditions
  const { data: PRs } = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    head: `merge/${refName}`,
    base: 'master',
    state: 'open',
  });

  const prBackExists = PRs.length === 0;

  // Job Flags
  const shouldRunStart = isMaster && isWorkflowDispatch;
  const shouldRunPromote = isReleaseBranch && isWorkflowDispatch;
  const shouldRunChangesets = shouldRunPromote || shouldRunStart || (isReleaseBranch && isPush);
  const shouldRunPublish = isReleaseBranch && isPush && !pendingChangesets;
  const shouldRunMerge =
    isReleaseBranch && isPush && !prerelease && isCurrentFinalVersion && !pendingChangesets && prBackExists;

  function setOutput(key, value) {
    core.info(`State variable ${key} set to ${value}`);
    core.setOutput('start', shouldRunStart);
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
