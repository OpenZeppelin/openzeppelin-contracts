const { readPreState } = require('@changesets/pre');
const { default: readChangesets } = require('@changesets/read');
const { join } = require('path');
const { fetch } = require('undici');
const { version, name: packageName } = require(join(__dirname, '../../../contracts/package.json'));

module.exports = async ({ github, context, core }) => {
  const state = await getState({ github, context, core });

  function setOutput(key, value) {
    core.info(`State ${key} = ${value}`);
    core.setOutput(key, value);
  }

  // Jobs to trigger
  setOutput('start', shouldRunStart(state));
  setOutput('promote', shouldRunPromote(state));
  setOutput('changesets', shouldRunChangesets(state));
  setOutput('publish', shouldRunPublish(state));
  setOutput('merge', shouldRunMerge(state));

  // Global Variables
  setOutput('is_prerelease', state.prerelease);
};

function shouldRunStart({ isMaster, isWorkflowDispatch, botRun }) {
  return isMaster && isWorkflowDispatch && !botRun;
}

function shouldRunPromote({ isReleaseBranch, isWorkflowDispatch, botRun }) {
  return isReleaseBranch && isWorkflowDispatch && !botRun;
}

function shouldRunChangesets({ isReleaseBranch, isPush, isWorkflowDispatch, botRun }) {
  return (isReleaseBranch && isPush) || (isReleaseBranch && isWorkflowDispatch && botRun);
}

function shouldRunPublish({ isReleaseBranch, isPush, hasPendingChangesets, isPublishedOnNpm }) {
  return isReleaseBranch && isPush && !hasPendingChangesets && !isPublishedOnNpm;
}

function shouldRunMerge({
  isReleaseBranch,
  isPush,
  prerelease,
  isCurrentFinalVersion,
  hasPendingChangesets,
  prBackExists,
}) {
  return isReleaseBranch && isPush && !prerelease && isCurrentFinalVersion && !hasPendingChangesets && !prBackExists;
}

async function getState({ github, context, core }) {
  // Variables not in the context
  const refName = process.env.GITHUB_REF_NAME;
  const botRun = process.env.TRIGGERING_ACTOR === 'github-actions[bot]';

  const { changesets, preState } = await readChangesetState();

  // Static vars
  const state = {
    refName,
    hasPendingChangesets: changesets.length > 0,
    prerelease: preState?.mode === 'pre',
    isMaster: refName === 'master',
    isReleaseBranch: refName.startsWith('release-v'),
    isWorkflowDispatch: context.eventName === 'workflow_dispatch',
    isPush: context.eventName === 'push',
    isCurrentFinalVersion: !version.includes('-rc.'),
    botRun,
  };

  // Async vars
  const { data: prs } = await github.rest.pulls.list({
    owner: context.repo.owner,
    repo: context.repo.repo,
    head: `${context.repo.owner}:merge/${state.refName}`,
    base: 'master',
    state: 'open',
  });

  state.prBackExists = prs.length !== 0;

  state.isPublishedOnNpm = await isPublishedOnNpm(packageName, version);

  // Log every state value in debug mode
  if (core.isDebug()) for (const [key, value] of Object.entries(state)) core.debug(`${key}: ${value}`);

  return state;
}

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

async function isPublishedOnNpm(packageName, version) {
  const res = await fetch(`https://registry.npmjs.com/${packageName}/${version}`);
  return res.ok;
}
