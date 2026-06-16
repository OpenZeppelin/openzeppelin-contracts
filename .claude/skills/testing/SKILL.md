---
name: testing
description: Testing conventions for openzeppelin-contracts. Use when writing or modifying tests, mocks, or formal verification specs. Covers hardhat-exposed $-wrappers, when manual mocks are warranted, Hardhat+Chai patterns (loadFixture, shouldBehaveLike, multi-target loops), Foundry fuzz, Halmos symbolic execution, Certora rule-based verification, and the changeset rule.
---

# Testing

## When to use each approach

| Approach                      | Required when                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Formal verification (Certora) | Contract includes a state machine or access-control rules complex enough that fuzzing won't cover the cases |
| Symbolic execution (Halmos)   | A property is expressible as a Foundry test with symbolic inputs — fast, no external credentials            |
| Fuzzing (Foundry)             | Math-heavy code, data structures, complex invariants not suited for FV                                      |
| Edge unit cases (Hardhat)     | All contracts: golden path + pathological/border cases. This is the baseline.                               |

Default to Hardhat+Chai unit tests, add Halmos for invariants you can express symbolically, escalate to Certora when state-machine coverage requires it.

A bug fix must add a minimal test that reproduces the bug, committed alongside the fix. The objective is 100% branch coverage per PR.

## Accessing internal functions: hardhat-exposed

`$`-prefixed wrapper contracts are **auto-generated** by [hardhat-exposed](https://github.com/frangio/hardhat-exposed). The plugin creates a `$ContractName` for every contract in `contracts/`, with every internal `_function` re-exposed as an external `$_function`. Output goes to `contracts-exposed/` (gitignored). Use them directly:

```javascript
const token = await ethers.deployContract('$ERC20', ['Name', 'SYM']);
await token.$_mint(holder, 1000n);
```

**Do not write `$`-prefixed wrappers by hand.**

## Manual mocks in `contracts/mocks/`

Manual mocks live in `contracts/mocks/` (not `test/`) and mirror the `contracts/` directory layout. Write a manual mock only when `hardhat-exposed` cannot give you what you need:

- **Constructor-level setup** that auto-generation can't provide — e.g. `ERC721ConsecutiveMock` calling `_mintConsecutive` during construction.
- **Multi-extension composition** to test how extensions compose — e.g. `ERC721Consecutive + ERC721Pausable + ERC721Votes`.
- **Injected behavior** that overrides a hook to simulate an edge case — e.g. `ERC20Reentrant` firing a reentrant call inside `_update`.
- **Adversarial behavior** with no analogue in the base — e.g. `ReentrancyAttack`, `ERC20ReturnFalseMock`.
- **A plain public wrapper** for an internal operation where the auto-generated signature is unsuitable — e.g. `ERC20Mock.mint`.

Even inside a manual mock, prefer the auto-generated `$_` functions over redeclaring the same exposure:

```solidity
// prefer (reuses auto-generated exposure):
await token.$_mint(holder, 1000n);

// avoid (redundant — hardhat-exposed already provides this):
contract ERC20Mock is ERC20 {
    function __mint(address account, uint256 value) external { _mint(account, value); }
}
```

## Hardhat + Chai (`.test.js`)

**Fixtures**: use `loadFixture` from `@nomicfoundation/hardhat-network-helpers`. Define an async `fixture` and call `loadFixture(fixture)` in `beforeEach`.

```javascript
const fixture = async () => {
  const [holder, recipient] = await ethers.getSigners();
  const token = await ethers.deployContract('$ERC20', [name, symbol]);
  await token.$_mint(holder, initialSupply);
  return { holder, recipient, token };
};

beforeEach(async function () {
  Object.assign(this, await loadFixture(fixture));
});
```

**Structure**: `describe('ContractName') > describe('methodName') > it('description')`.

**Shared behavior**: reuse via `shouldBehaveLike*` functions in sibling `.behavior.js` files. Mount with this-context state set in the fixture:

```javascript
const { shouldBehaveLikeERC20 } = require('./ERC20.behavior');
// ...
shouldBehaveLikeERC20(initialSupply, { forcedApproval });
```

**Multi-target loops**: when the same suite should run against several wrappers (e.g. the auto-generated `$ERC20` and a manual `$ERC20ApprovalMock`), iterate at the top:

```javascript
const TOKENS = [{ Token: '$ERC20' }, { Token: '$ERC20ApprovalMock', forcedApproval: true }];
for (const { Token, forcedApproval } of TOKENS) {
  describe(Token, function () {
    /* … */
  });
}
```

**Assertion style**:

- `bigint` literals (`100n`) for uint values — not `ethers.BigNumber`.
- Custom errors: `.revertedWithCustomError(contract, 'ErrorName').withArgs(...)`.
- Panics: `.revertedWithPanic(PANIC_CODES.ARITHMETIC_UNDER_OR_OVERFLOW)`.
- Events: `.emit(contract, 'EventName').withArgs(...)`.
- Balance changes: `.changeTokenBalance(token, account, delta)` / `.changeTokenBalances(token, [a, b], [d1, d2])`.

## Foundry (`.t.sol`)

Foundry tests live next to their Hardhat counterparts in `test/`. They are picked up by `forge test`. Two distinct purposes:

**Fuzzing**: function name starts with `test`, parameters are typed. Foundry generates random inputs.

```solidity
function testFuzzAdd(uint256 a, uint256 b) public pure {
  vm.assume(a < type(uint256).max - b); // restrict if needed
  assertEq(Math.add(a, b), a + b);
}
```

Use `assertEq`, `assertGt`, etc. from `forge-std/Test.sol`. Fuzz settings live in `foundry.toml` (default `runs = 5000`).

**Symbolic execution (Halmos)**: function name starts with `symbolic` or `testSymbolic` — that's what the CI `halmos` job matches (`--match-test '^symbolic|^testSymbolic'`). These run as regular Foundry fuzz tests as well.

```solidity
function testSymbolicTransfer(address to, uint256 amount) public {
  // Halmos treats inputs as fully symbolic (all values).
  // Use vm.assume(...) for preconditions.
}
```

Halmos runs on every PR, needs no credentials. Reach for it when a property can be expressed as a Foundry test.

**Pragma note**: Foundry compiles with `solc 0.8.31` (`foundry.toml`); contract pragmas in `contracts/` may still be `^0.8.20`. New `.t.sol` files should match the contract's pragma minimum unless they specifically need a newer feature.

## Certora (rule-based formal verification)

[Certora](https://certora.com) specs live in `fv/specs/` as `.conf` + `.spec` pairs. The CI job runs on PRs labeled `formal-verification` or `formal-verification-force-all`. Requires a `CERTORAKEY`.

Local workflow:

```bash
make -C fv apply           # apply harness patches first
node fv/run.js AccessControl   # runs fv/specs/AccessControl.conf
node fv/run.js --all           # runs every spec
```

Use Certora when a property is too complex for Halmos, or when a state machine needs deeper rule coverage than fuzzing provides.

## Changesets

Every PR that changes contract behavior needs a changeset. Skip for NatSpec-only edits, internal refactors with no user-visible effect, or pure repo plumbing.

```bash
npx changeset add
```

The generated file in `.changeset/` looks like:

```
---
'openzeppelin-solidity': minor
---

`ComponentName`: One-sentence description starting with a backtick-quoted contract or component name.
```

- `patch` — bug fixes.
- `minor` — new features.
- One sentence. No bullet points, no multi-paragraph prose. The release pipeline composes these into `CHANGELOG.md` automatically.

## CI matrix you should keep in mind

| Job                   | What it runs                                                           | Triggered by                                                        |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `lint`                | `npm run lint`                                                         | Every push/PR                                                       |
| `tests`               | `npm test` + inheritance, pragma, generation checks                    | Every push/PR                                                       |
| `tests-upgradeable`   | Transpile then re-run all Hardhat tests + storage-layout diff          | Every push/PR                                                       |
| `tests-foundry`       | `forge test -vvv` (includes Halmos symbolic)                           | Every push/PR                                                       |
| `coverage`            | `npm run coverage` → codecov                                           | Every push/PR                                                       |
| `slither`             | Slither static analysis for common vulnerabilities                     | Every push/PR                                                       |
| `formal verification` | Certora specs for changed `.spec` files (or all, with the force label) | PRs labeled `formal-verification` / `formal-verification-force-all` |
