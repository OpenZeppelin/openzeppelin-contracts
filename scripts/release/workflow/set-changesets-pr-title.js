const { execSync } = require('child_process');
const { coerce, lt, rcompare, inc, rsort } = require('semver');
const { join } = require('path');
const { version } = require(join(__dirname, '../../../package.json'));
const read = cmd => execSync(cmd, { encoding: 'utf8' }).trim();
const run = cmd => execSync(cmd, { stdio: 'inherit' });

// This can be run from `master` in the `start` workflow
// We assume branch is already created, so we optionally switch
const checkoutToReleaseBranch = () => {
  const [{ major, minor }] = read(`git --no-pager branch -l 'release-v*'`)
    .replace(/origin\/.*release-v(.+)/g, '$1') // release-vX.Y -> X.Y
    .split(/\r?\n/)
    .filter(coerce) // Filter only valid versions
    .map(coerce)
    .filter(v => lt(coerce(v), version)) // Filter older versions
    .sort(rcompare);

  const releaseBranch = `release-v${major}.${minor}`;
  const currentBranch = process.env.GITHUB_REF_NAME;

  if (currentBranch !== releaseBranch) run(`git checkout ${releaseBranch}`);
  return releaseBranch;
};

module.exports = async ({ core }) => {
  const refName = checkoutToReleaseBranch();

  // Compare package.json version's next patch vs. first version patch
  // A recently opened branch will give the next patch for the previous minor
  // So, we get the max against the patch 0 of the release branch's version
  const branchPatch0 = coerce(refName.replace('release-v', '')).version;
  const packageJsonNextPatch = inc(version, 'patch');
  const [nextVersion] = rsort([branchPatch0, packageJsonNextPatch], false);

  core.exportVariable(`TITLE=Release v${nextVersion}`);
};
