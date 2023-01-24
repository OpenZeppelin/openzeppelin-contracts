# Engineering Guidelines

## Testing

Code must be thoroughly tested with quality unit tests.

We defer to the [Moloch Testing Guide](https://github.com/MolochVentures/moloch/tree/master/test#readme) for specific recommendations, though not all of it is relevant here. Note the introduction:

> Tests should be written, not only to verify correctness of the target code, but to be comprehensively reviewed by other programmers. Therefore, for mission critical Solidity code, the quality of the tests are just as important (if not more so) than the code itself, and should be written with the highest standards of clarity and elegance.

Every addition or change to the code must come with relevant and comprehensive tests.

Refactors should avoid simultaneous changes to tests.

Flaky tests are not acceptable.

The test suite should run automatically for every change in the repository, and in pull requests tests must pass before merging.

The test suite coverage must be kept as close to 100% as possible, enforced in pull requests.

In some cases unit tests may be insufficient and complementary techniques should be used:

1. Property-based tests (aka. fuzzing) for math-heavy code.
2. Formal verification for state machines.

## Code style

Solidity code should be written in a consistent format enforced by a linter, following the official [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html). See below for further [Solidity Conventions](#solidity-conventions).

The code should be simple and straightforward, prioritizing readability and understandability. Consistency and predictability should be maintained across the codebase. In particular, this applies to naming, which should be systematic, clear, and concise.

Sometimes these guidelines may be broken if doing so brings significant efficiency gains, but explanatory comments should be added.

Modularity should be pursued, but not at the cost of the above priorities.

## Documentation

For contributors, project guidelines and processes must be documented publicly.

For users, features must be abundantly documented. Documentation should include answers to common questions, solutions to common problems, and recommendations for critical decisions that the user may face.

All changes to the core codebase (excluding tests, auxiliary scripts, etc.) must be documented in a changelog, except for purely cosmetic or documentation changes.

## Peer review

All changes must be submitted through pull requests and go through peer code review.

The review must be approached by the reviewer in a similar way as if it was an audit of the code in question (but importantly it is not a substitute for and should not be considered an audit).

Reviewers should enforce code and project guidelines.

External contributions must be reviewed separately by multiple maintainers.

## Automation

Automation should be used as much as possible to reduce the possibility of human error and forgetfulness.

Automations that make use of sensitive credentials must use secure secret management, and must be strengthened against attacks such as [those on GitHub Actions worklows](https://github.com/nikitastupin/pwnhub).

Some other examples of automation are:

- Looking for common security vulnerabilities or errors in our code (eg. reentrancy analysis).
- Keeping dependencies up to date and monitoring for vulnerable dependencies.

# Solidity Conventions

In addition to the official Solidity Style Guide we have a number of other conventions that must be followed.

* All state variables should be private.

  Changes to state should be accompanied by events, and in some cases it is not correct to arbitrarily set state. Encapsulating variables as private and only allowing modification via setters enables us to ensure that events and other rules are followed reliably and prevents this kind of user error.

* Internal or private state variables or functions should have an underscore prefix.

  ```
  contract TestContract {
      uint256 private _privateVar;
      uint256 internal _internalVar;
      function _testInternal() internal { ... }
      function _testPrivate() private { ... }
  }
  ```

* Events should be emitted immediately after the state change that they
  represent, and should be named in the past tense.

  ```
  function _burn(address who, uint256 value) internal {
      super._burn(who, value);
      emit TokensBurned(who, value);
  }
  ```

  Some standards (e.g. ERC20) use present tense, and in those cases the
  standard specification is used.
  
* Interface names should have a capital I prefix.

  ```
  interface IERC777 {
  ```

* Unchecked arithmetic blocks should contain comments explaining why overflow is guaranteed not to happen. If the reason is immediately apparent from the line above the unchecked block, the comment may be omitted.
