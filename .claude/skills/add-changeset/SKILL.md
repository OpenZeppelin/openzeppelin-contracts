---
name: add-changeset
description: Add a changelog entry for a PR. Use when the user asks for a changeset, when finishing a PR that changes user-visible contract behavior, or when the changeset-bot has flagged the PR. Skip for NatSpec-only edits, internal refactors with no observable effect, or repo plumbing.
---

# Add a changeset

## When to add one

Add a changeset when the PR changes **user-visible contract behavior**: a new function, a new contract or extension, a bug fix that changes outputs, a gas optimization that callers can observe, a new event, a new error, a new interface ID, or a tighter requirement.

**Skip** for:

- NatSpec-only changes.
- Internal refactors with no observable effect.
- Test/mock-only changes.
- CI, lint, docgen, dependency bumps that don't change the published `contracts/`.

If unsure, err on the side of adding one — release reviewers can downgrade to "skip" by deleting the file before tagging.

## How

```bash
npx changeset add
```

The CLI prompts for severity, then opens an editor. Severity:

- `patch` — bug fixes, gas optimizations, no API surface change.
- `minor` — new contracts, new extensions, new public functions on existing contracts.

There is no `major` from contributors — major version bumps are coordinated by maintainers.

The resulting file in `.changeset/` looks like:

```
---
'openzeppelin-solidity': minor
---

`ComponentName`: One-sentence description starting with a backtick-quoted component name.
```

## Format rules

- **First word inside the backticks** is the affected contract, extension, or library: `ERC20`, `ERC1155Crosschain`, `Memory`, `Governor`, etc.
- **Then a colon, then one sentence** describing the user-visible change.
- **Imperative mood** (matching PR titles: "Add", "Fix", not "Added", "Fixed"). Trailing period optional.
- **No bullet points**, no headings, no multi-paragraph prose. The release workflow concatenates these verbatim.

Good examples (taken from existing entries):

```
`Memory`: Add a `isReserved(Slice)` function that checks if the memory occupied by the slice is reserved (i.e. before the free memory pointer).
```

```
`ERC1155Crosschain`: Add an ERC-1155 extension to embed an ERC-7786 based crosschain bridge directly in the token contract.
```

```
Add ERC-165 detection for the `IERC6909ContentURI`, `IERC6909TokenSupply` and `IERC6909Metadata` interfaces in the `ERC6909ContentURI`, `ERC6909TokenSupply` and `ERC6909Metadata` contracts respectively.
```

(The last form — no leading backticks — is acceptable when several components are touched at once and a single prefix would be misleading.)

## After committing

The `changeset-bot` GitHub check posts a comment confirming the changeset was detected. If the bot complains "No Changeset found" and the PR should not have one (NatSpec-only, etc.), leave a comment justifying it — a maintainer can apply the `ignore-changeset` label.
