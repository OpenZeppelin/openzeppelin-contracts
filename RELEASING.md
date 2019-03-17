# Releasing

This document describes our release process, and contains the steps to be followed by an OpenZeppelin maintainer at the several stages of a release.

We release a new version of OpenZeppelin monthly. Release cycles are tracked in the [issue milestones](https://github.com/OpenZeppelin/openzeppelin-solidity/milestones).

Each release has at least one release candidate published first, intended for community review and any critical fixes that may come out of it. At the moment we leave 1 week between the first release candidate and the final release.

Before starting make sure to verify the following items.
* Your local `master` branch is in sync with your `upstream` remote (it may have another name depending on your setup).
* Your repo is clean, particularly with no untracked files in the contracts and tests directories. Verify with `git clean -n`.


## Creating the release branch

We'll refer to a release `vX.Y.Z`.

```
git checkout master
git checkout -b release-vX.Y.Z
```

## Creating a release candidate

Once in the release branch, change the version string in `package.json`, `package-lock.json` and `ethpm.json` to `X.Y.Z-rc.R`. (This will be `X.Y.Z-rc.1` for the first release candidate.) Commit these changes and tag the commit as `vX.Y.Z-rc.R`.

```
git add package.json package-lock.json ethpm.json
git commit -m "Release candidate vX.Y.Z-rc.R"
git tag -a vX.Y.Z-rc.R
git push upstream release-vX.Y.Z
git push upstream vX.Y.Z-rc.R
```

Draft the release notes in our [GitHub releases](https://github.com/OpenZeppelin/openzeppelin-solidity/releases). Make sure to mark it as a pre-release! Try to be consistent with our previous release notes in the title and format of the text. Release candidates don't need a detailed changelog, but make sure to include a link to GitHub's compare page.

Once the CI run for the new tag is green, publish on npm under the `next` tag. You should see the contracts compile automatically.

```
npm publish --tag next
```

Publish the release notes on GitHub and the forum, and ask our community manager to announce the release candidate on at least Twitter.

## Creating the final release

Make sure to have the latest changes from `upstream` in your local release branch.

```
git checkout release-vX.Y.Z
git pull upstream
```

Before starting the release process, make one final commit to CHANGELOG.md, including the date of the release.

Change the version string in `package.json`, `package-lock.json` and `ethpm.json` removing the "-rc.R" suffix. Commit these changes and tag the commit as `vX.Y.Z`.

```
git add package.json package-lock.json ethpm.json
git commit -m "Release vX.Y.Z"
git tag -a vX.Y.Z
git push upstream release-vX.Y.Z
git push upstream vX.Y.Z
```

Draft the release notes in GitHub releases. Try to be consistent with our previous release notes in the title and format of the text. Make sure to include a detailed changelog.

Once the CI run for the new tag is green, publish on npm. You should see the contracts compile automatically.

```
npm publish
```

Publish the release notes on GitHub and ask our community manager to announce the release!

Delete the `next` tag in the npm package as there is no longer a release candidate.

```
npm dist-tag rm --otp $2FA_CODE openzeppelin-solidity next
```

## Merging the release branch

After the final release, the release branch should be merged back into `master`. This merge must not be squashed because it would lose the tagged release commit. Since the GitHub repo is set up to only allow squashed merges, the merge should be done locally and pushed.

Make sure to have the latest changes from `upstream` in your local release branch.

```
git checkout release-vX.Y.Z
git pull upstream
```

```
git checkout master
git merge --no-ff release-vX.Y.Z
git push upstream master
```

The release branch can then be deleted on GitHub.
