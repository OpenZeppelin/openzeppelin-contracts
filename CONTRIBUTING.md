Contributing to Zeppelin
=======

## Design Guidelines

These are some global design goals in Zeppelin.

### D0 - Security in Depth
We strive to provide secure, tested, audited code. To achieve this, we need to match intention with function. Thus, documentation, code clarity, community review and security discussions are fundamental.

### D1 - Simple and Modular
Simpler code means easier audits, and better understanding of what each component does. We look for small files, small contracts, and small functions. If you can separate a contract into two independent functionalities you should probably do it.

### D2 - Naming Matters

We take our time with picking names. Code is going to be written once, and read hundreds of times. Renaming for clarity is encouraged.

### D3 - Tests

Write tests for all your code. We encourage Test Driven Development so we know when our code is right. Even though not all code in the repository is tested at the moment, we aim to test every line of code in the future.

### D4 - Check preconditions and post-conditions

A very important way to prevent vulnerabilities is to catch a contract’s inconsistent state as early as possible. This is why we want functions to check pre- and post-conditions for executing its logic. When writing code, ask yourself what you are expecting to be true before and after the function runs, and express it in code.

### D5 - Code Consistency

Consistency on the way classes are used is paramount to an easier understanding of the library. The codebase should be as unified as possible. Read existing code and get inspired before you write your own. Follow the style guidelines. Don’t hesitate to ask for help on how to best write a specific piece of code.

### D6 - Regular Audits
Following good programming practices is a way to reduce the risk of vulnerabilities, but professional code audits are still needed. We will perform regular code audits on major releases, and hire security professionals to provide independent review.

## Style Guidelines

The design guidelines have quite a high abstraction level. These style guidelines are more concrete and easier to apply, and also more opinionated.

### General

#### G0 - Default to Solidity's official style guide.

Follow the official Solidity style guide: http://solidity.readthedocs.io/en/latest/style-guide.html

#### G1 - No Magic Constants

Avoid constants in the code as much as possible. Magic strings are also magic constants.

#### G2 - Code that Fails Early

We ask our code to fail as soon as possible when an unexpected input was provided or unexpected state was found.

#### G3 - Internal Amounts Must be Signed Integers and Represent the Smallest Units.

Avoid representation errors by always dealing with weis when handling ether. GUIs can convert to more human-friendly representations. Use Signed Integers (int) to prevent underflow problems.


### Testing

#### T1 - Tests Must be Written Elegantly

Style guidelines are not relaxed for tests. Tests are a good way to show how to use the library, and maintaining them is extremely necessary.

Don't write long tests, write helper functions to make them be as short and concise as possible (they should take just a few lines each), and use good variable names.

#### T2 - Tests Must not be Random

Inputs for tests should not be generated randomly. Accounts used to create test contracts are an exception, those can be random. Also, the type and structure of outputs should be checked.


### Documentation

TODO

## Pull Request Workflow

Our workflow is based on GitHub's pull requests. We use feature branches, prepended with: `test`, `feature`, `fix`, `refactor`, or `remove` according to the change the branch introduces. Some examples for such branches are:
```sh
git checkout -b test/some-module
git checkout -b feature/some-new-stuff
git checkout -b fix/some-bug
git checkout -b remove/some-file
```

We expect pull requests to be rebased to the master branch before merging:
```sh
git remote add zep git@github.com:OpenZeppelin/zeppelin-solidity.git
git pull --rebase zep master
```

Note that we require rebasing your branch instead of merging it, for commit readability reasons.

After that, you can push the changes to your fork, by doing:
```sh
git push origin your_branch_name
git push origin feature/some-new-stuff
git push origin fix/some-bug
```

Finally go to [github.com/OpenZeppelin/zeppelin-solidity](https://github.com/OpenZeppelin/zeppelin-solidity) in your web browser and issue a new pull request.

Main contributors will review your code and possibly ask for changes before your code is pulled in to the main repository.  We'll check that all tests pass, review the coding style, and check for general code correctness. If everything is OK, we'll merge your pull request and your code will be part of Zeppelin.

If you have any questions feel free to post them to
[github.com/OpenZeppelin/zeppelin-solidity/issues](https://github.com/OpenZeppelin/zeppelin-solidity/issues).

Finally, if you're looking to collaborate and want to find easy tasks to start, [look at the issues we marked as easy](https://github.com/OpenZeppelin/zeppelin-solidity/labels/easy).

Thanks for your time and code!
