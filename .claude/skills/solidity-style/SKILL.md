---
name: solidity-style
description: Solidity style and safety conventions for contract source files. Use when writing or editing any .sol file under contracts/. Covers errors, events, NatSpec, imports, file structure, assembly, unchecked, casting, numeric literal formatting, and inheritance ordering.
---

# Solidity style and safety

The conventions below are not enforced by solhint. For the lint-enforced rules (private state vars, underscore prefixes, library visibility, etc.), see the project root `CLAUDE.md`.

## Errors

Prefer `if (condition) revert CustomError(args);`. `require(condition, CustomError())` (available via IR in `^0.8.26`, stable in `^0.8.27`) is acceptable only when the file's pragma already targets that version and the rest of the file uses it. Do not bump pragma just to use it.

Custom errors follow [ERC-6093](https://eips.ethereum.org/EIPS/eip-6093):

- **Domain prefix**: `ERC<number>` if the error violates an ERC spec; otherwise the component name (`Governor`, `ECDSA`, `Timelock`).
- **Include offending values** as arguments so callers can decode the failure context.
- **Never declare the same error name twice** across the library — duplicates cause identifier conflicts when inheriting from multiple contracts.

**Location priority**:

1. Reuse the error from the underlying ERC if already defined there.
2. Otherwise declare in the interface or library that owns the concept.
3. Otherwise declare in the implementation (when the interface/library is already pinned by an ERC).
4. Otherwise declare in the extension where it actually fires.

## Events

Emit **after** the state change. Past-tense CapWords names (`OwnershipTransferred`, `RoleGranted`). ERC-standard events use the tense specified in the ERC (e.g. ERC-20's `Transfer` is present tense — follow the spec). Declare events in the interface or at the top of the emitting contract.

## NatSpec

`@dev` is the only tag rendered by the OZ documentation engine. Use it as the primary tag everywhere. `@notice`, `@param`, `@return` appear in interface files where ERC specs are kept verbatim — do not add `@notice` to implementation contracts; it will not appear in generated docs.

- Single-line: `/// @dev …`
- Multi-line: `/** @dev … */`
- Document everything: public, internal, and private functions; events; errors; constructors.

**Overrides**:

- Pure relay with nothing to add: `/// @inheritdoc InterfaceName`
- Override with added requirements or caveats: `/** @dev See {Interface-functionName}. \n\n Requirements: … */`

**Cross-references**: `{ContractName-functionName}` — e.g. `{IERC20-transfer}`, `{_update}`.

**Section headers** inside `@dev` blocks: `Requirements:`, `NOTE:`, `WARNING:`, `IMPORTANT:`. Frame caveats as conserved properties of the contract, not as alarms about safe behaviors.

## Imports and file structure

100% named curly-brace imports. Relative paths within `contracts/`. No wildcards:

```solidity
import { IERC20, IERC20Metadata } from '../../interfaces/IERC20.sol';
```

File order:

1. `// SPDX-License-Identifier: MIT`
2. `// OpenZeppelin Contracts (last updated vX.Y.Z) (path/to/file.sol)` — **release-managed; do not add or edit by hand**. `scripts/release/update-comment.js` rewrites this line at release time based on which `contracts/**/*.sol` files changed since the previous tag. New files: write only the SPDX line; the release script appends the second line on first inclusion.
3. `pragma solidity …`
4. Imports
5. Contract-level NatSpec
6. Contract declaration

Inside the body: `using` → structs/enums → state vars → constants → errors → events → constructor → modifiers → external/public functions → internal → private.

## Pragma

Don't pick the pragma floor by hand. Run:

```bash
npm run pragma
```

`scripts/minimize-pragma.js` builds a dependency graph from compiled artifacts, compiles each file against every candidate `solc`, and writes back the lowest version that compiles for that file and is compatible with all of its dependents. The script picks the syntax for you (`>=` for interfaces, `^` for implementations and libraries) and respects the `minVersionForContracts` floor (default `0.8.20`).

When adding a new file, start with the same pragma as a similar existing file in the same directory; the minimizer will tighten it on the next run. When editing a file, run the minimizer if you've used a feature that may have raised the floor.

The CI `test:pragma` job (`npm run test:pragma`) verifies the floor is honest about the opcodes the contract emits. Raising the floor without checking opcode availability on target chains (`mcopy` from 0.8.24 is the example) is the failure mode this guards against.

## Assembly

Always annotate `assembly ("memory-safe")`. Omitting the annotation disables the memory optimizer and increases gas. Include inline comments for any non-trivial operation.

**Numeric literals** inside assembly:

- **Memory-related** (locations, offsets, lengths): hexadecimal. `mload(0x40)`, `mstore(add(ptr, 0x20), value)`, `keccak256(ptr, 0x55)`.
- **Bit operations** (shift amounts, bit counts): decimal. `shl(128, value)`, `sar(96, x)`.
- Trivially small values like `1` or `2` may use decimal even in memory contexts: `ptr := add(ptr, 1)`.
- In `call`/`staticcall`/`delegatecall`, decimal zero is acceptable when both location and length are zero.

## `unchecked`

Only use `unchecked` with an inline invariant comment that names the bound. The comment may be omitted only when the reason is immediately apparent from the line directly above:

```solidity
unchecked {
    // Overflow not possible: value <= fromBalance <= totalSupply.
    _balances[from] = fromBalance - value;
}
```

When reviewing, re-derive the bound for every code path that can reach the block.

## Casting

Any narrowing integer cast (`uint256 → uint48`, etc.) must use `SafeCast.toUintXX()` (or the appropriate `toIntXX`). Direct Solidity casts are only permitted after an explicit bounds check on a line you can point to.

## Inheritance ordering

The relative order of bases in any `is A, B, C` list must be globally consistent. CI runs `npm run test:inheritance` against compiled artifacts to detect conflicts. After any change to an `is` list:

```bash
npm run compile && npm run test:inheritance
```

## Procedurally generated contracts

If the file header says `// This file was procedurally generated from …`, do not edit it. Edit the template in `scripts/generate/templates/` and run `npm run generate`. CI runs `npm run test:generation` to enforce this.
