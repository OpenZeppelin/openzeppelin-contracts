import { readPreState } from '@changesets/pre';
import { readChangesets } from '@changesets/read';
import fs from 'fs';
import path from 'path';
import { fetch } from 'undici';

const { version, name: packageName } = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, '../../../contracts/package.json'), 'utf8'),
);

export default async ({ github, context, core }) => {
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

// From https://github.com/changesets/action/blob/v2.1.1/src/readChangesetState.ts
async function readChangesetState(cwd = process.cwd()) {
  const preState = await readPreState(cwd);
  const changesets = await readChangesets(cwd);

  // In prerelease mode, the changesets that were already consumed by a previous `changeset version`
  // live in `.changeset/pre/` and are still reported by `readChangesets`. They are not pending: they
  // ship with the current release candidate, and only become releasable again on `changeset pre exit`.
  return preState !== undefined && preState.mode === 'pre'
    ? { preState, changesets: changesets.filter(changeset => !changeset.id.startsWith('pre/')) }
    : { preState: undefined, changesets };
}

async function isPublishedOnNpm(packageName, version) {
  const res = await fetch(`https://registry.npmjs.com/${packageName}/${version}`);
  return res.ok;
}
