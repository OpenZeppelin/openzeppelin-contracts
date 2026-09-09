# openzeppelin-contracts — Claude project guide

This repository is a **Solidity smart contract library**: reusable `abstract contract` and `library` implementations meant to be inherited and extended by downstream projects. It is not a deployed product. Most conventions exist because code here is a base for others: functions must be overridable, argument types must not constrain inheritors, and the public API must not force a particular call context on child contracts.

Read [`GUIDELINES.md`](./GUIDELINES.md) first — it is the human contributor spec and authoritative. This file is for what is specific to Claude-assisted work, plus the conventions not fully documented elsewhere.

Before preparing a contribution, also read [`CONTRIBUTING.md`](./CONTRIBUTING.md) thoroughly. Non-trivial changes must be discussed in an issue before a PR is opened.

## Repo map

| Path                    | Purpose                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `contracts/`            | Library source. Subdirectory layout (`token/ERC20/`, `access/`, `utils/`, …) mirrors the public API.                                           |
| `contracts/mocks/`      | Mocks used by tests. Mirrors `contracts/`. Manual mocks only — see the `testing` skill.                                                        |
| `contracts/interfaces/` | ERC interfaces in their pristine spec form.                                                                                                    |
| `test/`                 | Hardhat + Chai tests (`.test.js`), shared behaviors (`.behavior.js`), and Foundry tests (`.t.sol`).                                            |
| `contracts-exposed/`    | Auto-generated `$ContractName` wrappers from `hardhat-exposed`. Gitignored. Do not edit.                                                       |
| `fv/`                   | Certora specs (`fv/specs/*.{conf,spec}`), harnesses, and `make`-applied patches.                                                               |
| `scripts/generate/`     | Procedurally generated `.sol` files (Arrays variants, Checkpoints, EnumerableSet, …). Source of truth is the template, not the generated file. |
| `scripts/checks/`       | CI checks: `inheritance-ordering.js`, `pragma-validity.js`, generation diff, storage layout.                                                   |
| `docs/`                 | AsciiDoc sources used by the OZ documentation site. Per-module `README.adoc` files in `contracts/**/` are also rendered.                       |
| `.changeset/`           | Per-PR changelog entries consumed by the release workflow.                                                                                     |
| `audits/`               | Historical third-party audit reports, one per release. Reference only.                                                                         |
| `.claude/skills/`       | Skills specific to working in this repository, loaded by AI assistants per task. See `CONTRIBUTING.md`.                                        |

## Commands

| Task                                     | Command                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Compile                                  | `npm run compile`                                                       |
| Tests (JS + Solidity)                    | `npm test`                                                              |
| Foundry tests only (forge defaults)      | `forge test -vvv`                                                       |
| Halmos symbolic tests                    | `halmos --match-test '^symbolic\|^testSymbolic' -vv`                    |
| Lint (JS + Sol)                          | `npm run lint` / `npm run lint:fix`                                     |
| Coverage                                 | `npm run coverage`                                                      |
| Inheritance order check                  | `npm run test:inheritance`                                              |
| Pragma validity check                    | `npm run test:pragma`                                                   |
| Generated-file freshness check           | `npm run test:generation`                                               |
| Regenerate procedural contracts          | `npm run generate`                                                      |
| Add a changelog entry                    | `npx changeset add`                                                     |
| Run a single Certora spec                | `node fv/run.js <SpecName>` (apply harnesses first: `make -C fv apply`) |

## What linting via solhint already enforces (don't re-state in code review)

`solhint-plugin-openzeppelin` + `scripts/solhint-custom/index.js` enforce, on `contracts/**/*.sol` (mocks and tests are exempt):

- **State variables are `private`** (`constant`/`immutable` are the only exceptions).
- **Underscore prefix matches visibility**: `private`/`internal` state vars and functions get `_`; `public`/`external` do not. Library internal functions do NOT get `_`.
- **No `external virtual`** (except fallback). The `public` default makes this redundant; flagged by `no-external-virtual`.
- **Libraries expose only `internal`/`private`**.
- **Interfaces start with `I`**, contracts use CapWords, events use CapWords, modifiers/params mixedCase.

If a lint rule already catches it, don't waste tokens explaining it — fix and move on.

## Always-on conventions

These apply to every change and are not lint-enforced:

- **File header version line**: don't add or edit the `// OpenZeppelin Contracts (last updated vX.Y.Z) (path)` line — release tooling (`scripts/release/update-comment.js`) maintains it automatically based on `git diff` between the previous tag and `HEAD`. The SPDX line is your only responsibility.
- **Pragma**: don't pick the floor by hand. Run `npm run pragma` and let `scripts/minimize-pragma.js` walk the dependency graph, compile against every candidate `solc`, and write back the lowest version that works for each file (`>=` prefix for interfaces, `^` for implementations and libraries). Bumping the floor casually can introduce opcodes (`mcopy` in 0.8.24, etc.) not supported on all target chains — the script's output is the safe answer.
- **Imports**: 100% named, curly-brace, relative paths within `contracts/`. No wildcards.
- **Inheritance order is globally consistent**: if you change an `is A, B, C` list, run `npm run compile && npm run test:inheritance` before pushing.
- **Changesets**: every PR that changes contract behavior needs one. Skip for NatSpec-only, internal refactors with no user-visible effect, or pure repo plumbing.
- **Procedurally generated files**: never hand-edit a file whose header says "procedurally generated from `<template>`". Edit the template under `scripts/generate/templates/` and run `npm run generate`. CI runs `test:generation` to enforce.
- **Backward compatibility**: released contracts are inherited downstream and transpiled into the `-upgradeable` package. Don't change existing `public`/`external` signatures, event or error shapes, or the storage layout of existing contracts. Changes are additive; deprecate rather than delete. Breaking changes are a maintainer decision tied to a major release.
- **Dependencies**: this library has no third-party dependencies that translate to the user, and nothing that could change behavior out from under it. Don't add an npm or Solidity dependency or a new external import without maintainer sign-off; reuse existing `contracts/utils/` helpers first. Code that needs third-party dependencies belongs in `openzeppelin-community-contracts`, not here.

## When to load which skill

Claude Code surfaces these from `.claude/skills/` based on the task. You can also reference them directly:

- **`library-api-design`** — when adding or modifying any contract in `contracts/` (visibility, `virtual`, `memory` vs `calldata`, `_update` pattern, internal/external split, no-ops over reverts, hooks).
- **`solidity-style`** — when writing or editing Solidity (errors, events, NatSpec, ERC-7201, assembly, `unchecked`, casting, immutables).
- **`testing`** — when writing tests or mocks (`hardhat-exposed` `$` wrappers, when manual mocks are warranted, `.behavior.js` reuse, multi-target test loops, Foundry fuzz, Halmos symbolic, Certora).
- **`add-changeset`** — at PR close, or when the user asks for one.

## Things to always verify manually

AI suggestions in these areas are often plausible-but-wrong. Read the surrounding code before accepting:

- **Cryptography** — anything in `contracts/utils/cryptography/`, hashing, ECDSA, EIP-712 domains, BLS, signatures.
- **ERC-7201 slot derivations** — recompute with `SlotDerivation.erc7201Slot()` and compare to the constant. The formula in the inline comment is mandatory.
- **Storage layout for transpiler-processed contracts** — adding/removing/reordering fields breaks proxied deployments. CI runs storage-layout diff but read it.
- **`delegatecall`, inline assembly, memory safety** — verify the `memory-safe` annotation is honest and stack/scratch usage is bounded.
- **`unchecked` invariants** — re-derive the overflow-impossible claim for every code path. The inline comment is the contract.
- **`_authorizeUpgrade` access control** — the base is empty by design; every override must restrict.
- **`_disableInitializers()`** in implementation constructors for UUPS/Transparent proxy targets.
- **Pragma bumps** — check that any new opcode the compiler will emit is supported on all target chains.

## Out of scope for AI

- Adding/renaming public API or deciding whether a feature belongs in the library — open an issue first.
- Security assessments or audit opinions.
- New ERC interfaces or standards without explicit direction.
- Restructuring tests without a corresponding contract change.
- Fabricated bug bounties and security rewards. Never claim or imply a reward, amount, or eligibility. The only existing program is [Immunefi](https://immunefi.com/bounty/openzeppelin) (See [`SECURITY.md`](./SECURITY.md)).
