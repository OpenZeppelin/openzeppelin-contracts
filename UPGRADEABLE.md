# Technical notes about the Upgradeable repository

## [Branches](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/branches)

### `patches`

Built on top of the `master` branch of the vanilla Contracts repo, contains the changes necessary to build this package: it adds the scripts to transpile and GitHub Actions for it to work automatically, changes the package name, etc.

It can also include small changes to the Solidity code, such as reordering of state variables, in order to ensure storage compatibility.

It's an important goal that this branch should be easy to merge with the vanilla Contracts repo, avoiding merge conflicts as much as possible. This is necessary to reduce manual intervention and ensure automation runs smoothly.

This branch will not necessarily be up to date with the vanilla `master` branch, only up to the point necessary to guarantee successful merging with any new updates. In some cases it will be necessary to apply a manual merge with new changes, it is this branch that should be updated for the changes to propagate to all other branches.

### `patched/master`, `patched/release-vX.Y`

These branches are the merge between `patches` and the corresponding branch from vanilla Contracts. These branches should generally not be updated manually.

### `master`, `release-vX.Y`

Contains the transpiled code corresponding to the branch from vanilla Contracts of the same name. These are generated automatically based on their `patched/*` branch. These branches should never be manually updated, because they will be overwritten automatically with the transpiled version of `patched/*`. Instead, changes should be made in `patches`.

## [Actions Workflows](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/actions)

### [Merge upstream](/.github/workflows/merge-upstream.yml)

All this does is fetch the latest changes from a corresponding branch in the vanilla Contracts repo, tries to merge them with `patches`, and then pushes the updated branch to `patched/*`. If the merge has conflicts, the worfklow will fail. We should be notified of this so that we can updated the `patches` branch resolving conflicts and trigger the merge again. This should not happen often.

### [Transpile](/.github/workflows/transpile.yml)

Runs every time a `patched/*` branch is pushed to (for example as part of the Merge upstream workflow), transpiles the contents of that branch, and pushes the results as a new commit on the transpiled branch.

### [Test](/.github/workflows/test.yml)

Runs normal Contracts tests on the `master` and `release-v*` branches.

## Scripts

### `transpile-onto.sh`

```
bash scripts/upgradeable/transpile-onto.sh <target> [base]
```

Transpiles the contents of the current git branch and commits the result as a new commit on branch `<target>`. If branch `<target>` doesn't exist, it will copy the commit history of `[base]` (this is used in GitHub Actions, but is usually not necessary locally).

This script can be used manually to build transpiled versions of specific commits, or branches other than the `master` Contracts branch.
