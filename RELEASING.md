# Releasing

Checklist before starting:
* Make sure that your local master branch is in sync with upstream.
* Make sure that package-lock.json is up-to-date, and generated with the latest npm
  LTS version.
* Make sure that your repo is clean, particularly with no untracked files in
  the contracts and tests directories.

## Make a release candidate

```
git checkout master
git checkout -b release-v#.##.#
```

Edit the version in `package.json`, `package-lock.json` and `ethpm.json`
to "#.##.#-rc.#".

```
git commit -m "Release candidate v#.##.#-rc.#"
git tag -a v#.##.#-rc.#
npm test
git push upstream release-v#.##.#
git push upstream v#.##.#-rc.#
```

Check that the travis execution for the tag is green.

Draft the release notes in GitHub releases:
* Name the v#.##.# RC #.
* Add a short summary.
* Finish with: "Find the log of changes staged for this release at
  v#.##.#...v#.##.0-rc.1".

```
npm publish
```

Ask our community manager to announce the release candidate on Slack, Twitter,
Telegram... Recommend them to use plenty of emojis.

## Create a final release

```
git checkout release-v#.##.#
```

Manually modify the version in `package.json`, `package-lock.json` and `ethpm.json`
to remove the "-rc.#".

```
git commit -m "Release v#.##.#"
git tag -a v#.##.#
git push upstream v#.##.#
```

Draft the release notes in Github Releases.

```
git checkout master
git merge release-v#.#.##.#
git push --set-upstream upstream master
```
