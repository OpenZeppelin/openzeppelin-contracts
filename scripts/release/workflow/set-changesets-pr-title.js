import { coerce, inc, rsort } from 'semver';
import fs from 'fs';
import path from 'path';

const { version } = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../../package.json'), 'utf8'));

export default async ({ core }) => {
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
