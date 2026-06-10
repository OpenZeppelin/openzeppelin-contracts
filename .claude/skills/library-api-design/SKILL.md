---
name: library-api-design
description: API design rules for openzeppelin-contracts. Use when adding, modifying, or reviewing any contract under contracts/. Covers virtual, memory vs calldata, public vs external, overloads, no-op vs revert, _update single-override pattern, internal/external split, _msgSender, and override points.
---

# Library API design

This repo is a base library: every contract is inherited downstream. The rules below preserve that inheritability. Most of them are not lint-enforced — they require judgment when adding new contracts.

## `virtual` on overridable functions

Mark every `public` and `internal` function `virtual` — with two specific exceptions:

**Alias functions** (one function that just forwards to another with no added logic) are NOT virtual. The canonical form is the virtual one. Add a NatSpec `NOTE:` pointing to it:

```solidity
/**
 * @dev See {IERC20-transfer}.
 *
 * NOTE: This function is not virtual, {_update} should be overridden instead.
 */
function _transfer(address from, address to, uint256 value) internal {
  // ...
  _update(from, to, value);
}
```

**Convenience overloads** that only fill in a default argument are NOT virtual; the full-argument canonical form is:

```solidity
// not virtual (only sets emitEvent = true):
function _approve(address owner, address spender, uint256 value) internal {
    _approve(owner, spender, value, true);
}

// virtual (real override point):
function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual { ... }
```

Solhint's `no-external-virtual` rule catches `external virtual` (fallback excepted) — the right fix is `public virtual`, not silencing the rule.

## `memory` for reference-type arguments

Use `memory` for `string`, `bytes`, arrays, and structs — including in `public` functions. `calldata` forces every inheritor to match, so it is only valid in three narrow cases:

1. The return value is a slice of `msg.data` (e.g. `_msgData()` in `Context.sol`).
2. An internal calldata-decoding helper that is genuinely scoped to one function (e.g. `_extractSignatureValidator(bytes calldata signature) internal pure returns (address module, bytes calldata innerSignature)` in `AccountERC7579.sol`).
3. An explicit `Calldata`-suffixed parallel variant in a utility library, where the base version still uses `memory` (e.g. `MerkleProof.verifyCalldata`).

## `public` vs `external`

Default to `public`. Use `external` only when:

- The ERC spec itself defines the function as `external` (e.g. `ERC20Permit.DOMAIN_SEPARATOR`, `UUPSUpgradeable.proxiableUUID`).
- The contract design explicitly prevents internal calls and the function must only be reachable from outside (e.g. `ERC7786Recipient.receiveMessage`, where only an authorized gateway should call it and meta-transactions don't apply).

`external` for the second reason needs a NatSpec `NOTE:` explaining why.

## The internal/external split

`public` functions exist only to (1) capture `_msgSender()` and (2) delegate to an `internal` function that takes the actor as an explicit argument. All logic lives in the internal variant:

```solidity
function transfer(address to, uint256 value) public virtual returns (bool) {
  address owner = _msgSender();
  _transfer(owner, to, value);
  return true;
}
```

This keeps internal functions composable, testable through `hardhat-exposed`, and independently overridable.

## `_update` single override point

For state machines with several entry points (mint, burn, transfer), make `_mint`/`_burn`/`_transfer` non-virtual aliases that delegate to a single `virtual _update(...)`. Extensions override `_update` only, never the individual operations, and always call `super._update(...)` before adding side effects:

```solidity
function _update(address from, address to, uint256 value) internal virtual override {
  super._update(from, to, value); // base logic first
  _transferVotingUnits(from, to, value); // side effects after
}
```

## Prefer no-ops over reverts

If an operation can do nothing without creating a security concern, it should do nothing. This shows up at three levels:

**Vacuous inputs**: skip silently rather than reverting. `batchSize == 0` skips the whole mint loop; `ERC721Utils.checkOnERC721Received` skips the callback for EOAs because there is nothing to check. Document the no-op condition with a short inline comment.

**Idempotent state transitions**: return a `bool` from operations that may already be at the target state, instead of reverting. The caller can add a revert; the base never takes that choice away:

```solidity
function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
  if (hasRole(role, account)) {
    _roles[role].hasRole[account] = false;
    emit RoleRevoked(role, account, _msgSender());
    return true;
  }
  return false; // already revoked — no-op, not revert
}
```

**Empty virtual hooks**: `internal virtual {}` is a valid extension point when no default behavior exists. Always `_camelCase`, always `internal virtual`, always documented with `@dev`:

```solidity
/// @dev Hook called every time the tally for a proposal is updated.
function _tallyUpdated(uint256 proposalId) internal virtual {}
```

**Rule of thumb**: overrides can always add requirements on top of a no-op base. They cannot remove a requirement the base already enforces.

## `_msgSender()` vs `msg.sender`

Use `_msgSender()` in application logic. `msg.sender` appears only inside `Context.sol` / `ERC2771Context.sol`, or in deliberate protocol-level exceptions (e.g. `ERC7786Recipient.receiveMessage`, where wrapping the sender would break the protocol). Every exception outside the Context layer needs a `NOTE:` explaining why.

## `super` and extension contracts

`super` must be called in `_update` overrides, in `supportsInterface` overrides, and whenever an extension builds on base behavior. Skipping `super` is only acceptable for genuinely new functions that have no base implementation.

`supportsInterface` always follows the pattern:

```solidity
interfaceId == type(X).interfaceId || super.supportsInterface(interfaceId)
```

When overriding from multiple bases, list all of them: `override(A, B)`.

## Constructors, immutables, and the transpiler

| Keyword     | When                                                       | Naming                               |
| ----------- | ---------------------------------------------------------- | ------------------------------------ |
| `constant`  | Compile-time known (type hashes, role ids, slot addresses) | `ALL_CAPS_WITH_UNDERSCORES`          |
| `immutable` | Constructor-set, deploy-time computed                      | `_camelCase` (same as private state) |

Add `/// @custom:oz-upgrades-unsafe-allow state-variable-immutable` only when the value genuinely must not change across upgrades for security or correctness — e.g. `ERC2771Context._trustedForwarder`, where allowing it to change in an upgrade could introduce an untrusted forwarder. Don't add it to values that a governance system might legitimately want to change (e.g. `GovernorVotes._token`).

## ERC-7201 namespaced storage

ERC-7201 is **not** a general pattern. Upgradeable variants of contracts are auto-generated by the [OpenZeppelin Transpiler](https://github.com/OpenZeppelin/openzeppelin-transpiler) — do not manually write upgradeable storage layouts.

ERC-7201 is used only when namespacing is genuinely necessary, such as `Initializable.sol` (sequential slot 0 would be risky for proxy implementations). New uses must justify themselves in NatSpec. When it is the right tool:

```solidity
/// @custom:storage-location erc7201:openzeppelin.storage.MyContract
struct MyContractStorage {
    uint256 _value;
}

// keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.MyContract")) - 1)) & ~bytes32(uint256(0xff))
bytes32 private constant MY_CONTRACT_STORAGE = 0x...;

// solhint-disable-next-line var-name-mixedcase
function _getMyContractStorage() private pure returns (MyContractStorage storage $) {
    assembly {
        $.slot := MY_CONTRACT_STORAGE
    }
}
```

Rules: struct annotated with `@custom:storage-location`; inline formula comment above the constant; pointer variable always named `$`; `solhint-disable-next-line var-name-mixedcase` immediately before any function that uses `$`; constant in `ALL_CAPS`. Always verify the slot value with `SlotDerivation.erc7201Slot()` — never compute by hand.
