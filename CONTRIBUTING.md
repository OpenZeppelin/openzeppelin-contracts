Contributing to OpenZeppelin
=======

We really appreciate and value contributions to OpenZeppelin. Please take 5' to review the items listed below to make sure that your contributions are merged as soon as possible. 

## Contribution guidelines

Smart contracts manage value and are highly vulnerable to errors and attacks. We have very strict guidelines, please make sure to review them: ["Contribution guidelines wiki entry"](https://github.com/OpenZeppelin/zeppelin-solidity/wiki/Contribution-guidelines).

## Creating Pull Requests (PRs)

As a contributor, you are expected to fork this repository, work on your own fork and then submit pull requests. The pull requests will be reviewed and eventually merged into the main repo. See ["Fork-a-Repo"](https://help.github.com/articles/fork-a-repo/) for how this works.

*IMPORTANT* 
* Please use `rebase` instead of `merge` when updating your fork.
* Please see ["Git flow wiki entry"](https://github.com/OpenZeppelin/zeppelin-solidity/wiki/Git-flow) for understanding how to use branches in this repository.

## A typical workflow

1) Make sure your fork is up to date with the main repository:

```
cd zeppelin-solidity
git fetch upstream
git checkout development
git pull --rebase upstream development
```
NOTE: The directory `zeppelin-solidity` represents your fork's local copy.

2) Branch out from `development` into `fix/some-bug-#123`:
(Postfixing #123 will associate your PR with the issue #123 and make everyone's life easier =D)
```
git checkout -b fix/some-bug-#123
```

3) Make your changes, add your files, commit and push to your fork.

```
git add SomeFile.js
git commit "Fix some bug #123"
git push origin fix/some-bug-#123
```

4) Go to [github.com/OpenZeppelin/zeppelin-solidity](https://github.com/OpenZeppelin/zeppelin-solidity) in your web browser and issue a new pull request.

*IMPORTANT* Read the PR template very carefully and make sure to follow all the instructions. These instructions 
refer to some very important conditions that your PR must meet in order to be accepted, such as making sure that all tests pass, JS linting tests pass, solidity linting tests pass, etc.

5) Maintainers will review your code and possibly ask for changes before your code is pulled in to the main repository. We'll check that all tests pass, review the coding style, and check for general code correctness. If everything is OK, we'll merge your pull request and your code will be part of OpenZeppelin.

*IMPORTANT* Please pay attention to the maintainer's feedback, since its a necessary step to keep up with the standards OpenZeppelin attains to.

## All set!

If you have any questions feel free to post them to github.com/OpenZeppelin/zeppelin-solidity/issues.

Finally, if you're looking to collaborate and want to find easy tasks to start, look at the issues we marked as ["Good first issue"](https://github.com/OpenZeppelin/zeppelin-solidity/labels/good%20first%20issue).

Thanks for your time and code!
