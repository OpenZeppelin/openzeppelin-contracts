const { coerce, inc, rsort } = require('semver');
const { join } = require('path');
const { version } = require(join(__dirname, '../../../package.json'));

module.exports = async ({ core }) => {
  // Variables not in the context
  const refName = process.env.GITHUB_REF_NAME;

  // Compare package.json version's next patch vs. first version patch
  // A recently opened branch will give the next patch for the previous minor
  // So, we get the max against the patch 0 of the release branch's version
  const branchPatch0 = coerce(refName.replace('release-v', '')).version;
  const packageJsonNextPatch = inc(version, 'patch');
  const [nextVersion] = rsort([branchPatch0, packageJsonNextPatch], false);

  core.exportVariable('TITLE', `Release v${nextVersion}`);
};
