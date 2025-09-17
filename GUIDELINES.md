# Engineering Guidelines

## Testing

Code must be thoroughly tested with quality unit tests.

We defer to the [Moloch Testing Guide](https://github.com/MolochVentures/moloch/tree/master/test#readme) for specific recommendations, though not all of it is relevant here. Note the introduction:

> Tests should be written, not only to verify correctness of the target code, but to be comprehensively reviewed by other programmers. Therefore, for mission critical Solidity code, the quality of the tests is just as important (if not more so) than the code itself, and should be written to the highest standards of clarity and elegance.

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

Automations that make use of sensitive credentials must use secure secret management, and must be strengthened against attacks such as [those on GitHub Actions workflows](https://github.com/nikitastupin/pwnhub).

Some other examples of automation are:

- Looking for common security vulnerabilities or errors in our code (eg. reentrancy analysis).
- Keeping dependencies up to date and monitoring for vulnerable dependencies.

## Pull requests

Pull requests are squash-merged to keep the `master` branch history clean. The title of the pull request becomes the commit message, so it should be written in a consistent format:

1) Begin with a capital letter.
2) Do not end with a period.
3) Write in the imperative: "Add feature X" and not "Adds feature X" or "Added feature X".

This repository does not follow conventional commits, so do not prefix the title with "fix:" or "feat:".

Work in progress pull requests should be submitted as Drafts and should not be prefixed with "WIP:".

Branch names don't matter, and commit messages within a pull request mostly don't matter either, although they can help the review process.

# Solidity Conventions

In addition to the official Solidity Style Guide we have a number of other conventions that must be followed.

* All state variables should be private.

  Changes to state should be accompanied by events, and in some cases it is not correct to arbitrarily set state. Encapsulating variables as private and only allowing modification via setters enables us to ensure that events and other rules are followed reliably and prevents this kind of user error.

* Internal or private state variables or functions should have an underscore prefix.

  ```solidity
  contract TestContract {
      uint256 private _privateVar;
      uint256 internal _internalVar;
      function _testInternal() internal { ... }
      function _testPrivate() private { ... }
  }
  ```

* Functions should be declared virtual, with few exceptions listed below. The
  contract logic should be written considering that these functions may be
  overridden by developers, e.g. getting a value using an internal getter rather
  than reading directly from a state variable.

  If function A is an "alias" of function B, i.e. it invokes function B without
  significant additional logic, then function A should not be virtual so that
  any user overrides are implemented on B, preventing inconsistencies.

* Events should generally be emitted immediately after the state change that they
  represent, and should be named in the past tense. Some exceptions may be made for gas
  efficiency if the result doesn't affect observable ordering of events.

  ```solidity
  function _burn(address who, uint256 value) internal {
      super._burn(who, value);
      emit TokensBurned(who, value);
  }
  ```

  Some standards (e.g. ERC-20) use present tense, and in those cases the
  standard specification is used.

* Interface names should have a capital I prefix.

  ```solidity
  interface IERC777 {
  ```

* Contracts not intended to be used standalone should be marked abstract
  so they are required to be inherited to other contracts.

  ```solidity
  abstract contract AccessControl is ..., {
  ```

* Return values are generally not named, unless they are not immediately clear or there are multiple return values.

  ```solidity
  function expiration() public view returns (uint256) { // Good
  function hasRole() public view returns (bool isMember, uint32 currentDelay) { // Good
  ```

* Unchecked arithmetic blocks should contain comments explaining why overflow is guaranteed not to happen. If the reason is immediately apparent from the line above the unchecked block, the comment may be omitted.

* Custom errors should be declared following the [EIP-6093](https://eips.ethereum.org/EIPS/eip-6093) rationale whenever reasonable. Also, consider the following:

  * The domain prefix should be picked in the following order:
    1. Use `ERC<number>` if the error is a violation of an ERC specification.
    2. Use the name of the underlying component where it belongs (eg. `Governor`, `ECDSA`, or `Timelock`).

  * The location of custom errors should be decided in the following order:
    1. Take the errors from their underlying ERCs if they're already defined.
    2. Declare the errors in the underlying interface/library if the error makes sense in its context.
    3. Declare the error in the implementation if the underlying interface/library is not suitable to do so (eg. interface/library already specified in an ERC).
    4. Declare the error in an extension if the error only happens in such extension or child contracts.

  * Custom error names should not be declared twice along the library to avoid duplicated identifier declarations when inheriting from multiple contracts.

* Numeric literals should use appropriate formats based on their purpose to improve code readability:

  **Memory-related operations (use hexadecimal):**
  * Memory locations: `mload(64)` → `mload(0x40)`
  * Memory offsets: `mstore(add(ptr, 32), value)` → `mstore(add(ptr, 0x20), value)`
  * Memory lengths: `keccak256(ptr, 85)` → `keccak256(ptr, 0x55)`

  **Bit operations (use decimal):**
  * Shift amounts: `shl(0x80, value)` → `shl(128, value)`
  * Bit masks and positions should use decimal when representing bit counts

  **Exceptions:**
  * Trivially small values (1, 2) may use decimal even in memory operations: `ptr := add(ptr, 1)`
  * In `call`/`staticcall`/`delegatecall`, decimal zero is acceptable when both location and length are zero
