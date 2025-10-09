The upgradeable variant of OpenZeppelin Contracts is automatically generated from the original Solidity code. We call this process "transpilation" and it is implemented by our [Upgradeability Transpiler](https://github.com/OpenZeppelin/openzeppelin-transpiler/).

When the `master` branch or `release-v*` branches are updated, the code is transpiled and pushed to [OpenZeppelin/openzeppelin-contracts-upgradeable](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable) by the `upgradeable.yml` workflow.

## `transpile.sh`

Applies patches and invokes the transpiler with the command line flags we need for our requirements (for example, excluding certain files).

## `transpile-onto.sh`

```
bash scripts/upgradeable/transpile-onto.sh <target> [<base>]
```

Transpiles the contents of the current git branch and commits the result as a new commit on branch `<target>`. If branch `<target>` doesn't exist, it will copy the commit history of `[<base>]` (this is used in GitHub Actions, but is usually not necessary locally).

## `patch-apply.sh` & `patch-save.sh`

Some of the upgradeable contract variants require ad-hoc changes that are not implemented by the transpiler. These changes are implemented by patches stored in `upgradeable.patch` in this directory. `patch-apply.sh` applies these patches.

If the patches fail to apply due to changes in the repo, the conflicts have to be resolved manually. Once fixed, `patch-save.sh` will take the changes staged in Git and update `upgradeable.patch` to match.
