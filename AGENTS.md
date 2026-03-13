# AI Agent Guidelines for openzeppelin-contracts

This repository contains a **Solidity smart contract library**: reusable `abstract contract` and `library` implementations designed to be inherited and extended by downstream projects. It is not a deployed product. Many conventions exist specifically because code here is used as a base: functions must be overridable, argument types must be flexible for inheritors, and the public API must not force a particular call context on child contracts.

Read `GUIDELINES.md` for human contributor guidelines. This file covers what is specific to AI-assisted work and captures conventions that are not fully documented elsewhere.

---

## 1. Library API design (most important)

### `virtual` on all overridable functions

Mark all `public` and `internal` functions `virtual` unless the function is a deliberate alias or entry-gate. The two exceptions, from GUIDELINES.md:

- **Alias functions** (function A calls function B without significant additional logic) should NOT be virtual, so overrides land on B and not inconsistently on both. Document with a `NOTE:` in NatSpec:
  ```solidity
  // NOTE: This function is not virtual, {_update} should be overridden instead.
  function _mint(address account, uint256 value) internal {
    _update(address(0), account, value);
  }
  ```
- **Convenience overloads** that only supply a default argument to a full canonical form are NOT virtual. The canonical form is the virtual one:
  ```solidity
  // not virtual (only supplies default data = ""):
  function _safeMint(address to, uint256 tokenId) internal {
      _safeMint(to, tokenId, "");
  }
  // virtual (real override point):
  function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual { ... }
  ```

### `memory` for all reference-type arguments

Use `memory` for all function arguments of reference type (`string`, `bytes`, arrays, structs), including in `public` functions. `calldata` is only valid for external call sites and forces downstream inheritors to match that restriction. Use `calldata` only when:

1. The return type is a slice of `msg.data` (e.g. `_msgData()` in `Context.sol`).
2. Providing an internal calldata decoding function for the specific function (e.g. `_extractSignatureValidator(bytes calldata signature) internal pure returns (address module, bytes calldata innerSignature)` in `AccountERC7579.sol`).
3. Providing an explicit `Calldata`-suffixed parallel variant in a utility library (e.g. `MerkleProof.verifyCalldata`). The base version always uses `memory`; the `Calldata` variant is opt-in by name.

### `public` vs `external`

The default visibility for overridable functions is `public`. This allows child contracts to call the function internally, which is necessary for composability.

Use `external` only when:

- The ERC/EIP specification explicitly defines the function as `external` (e.g. `ERC20Permit.DOMAIN_SEPARATOR`, `UUPSUpgradeable.proxiableUUID`).
- The contract design explicitly prevents internal calls and requires the function to only be reachable from outside (e.g. `ERC7786Recipient.receiveMessage`, where only an authorized gateway should call it and meta-transactions don't apply).

When using `external` for the second reason, document it with a `NOTE:`.

### Function overloads

Short-argument overloads hardcode a sensible default and delegate to the full-argument canonical form. No logic in the short overload. Document which variant to override:

```solidity
// not virtual (just sets emitEvent = true):
function _approve(address owner, address spender, uint256 value) internal {
    _approve(owner, spender, value, true);
}
// virtual (all logic and overrides go here):
function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual { ... }
```

### Prefer no-ops over reverts

The library prefers doing nothing over reverting whenever an operation is vacuous and there are no security concerns. This design principle appears at three levels:

**1. Vacuous inputs: treat degenerate arguments as a no-op instead of reverting.**

If an operation on a zero-value or empty input would have no observable effect, skip it silently rather than reverting. This lets callers batch operations without needing to filter out edge cases. Always document the no-op condition with a `NOTE:` or inline comment:

```solidity
// minting a batch of size 0 is a no-op
if (batchSize > 0) {
    // ... actual logic
}
```

Similarly, `ERC721Utils.checkOnERC721Received` skips the callback entirely for EOAs (no code at target address): there is nothing to check, so doing nothing is correct and avoids an unnecessary revert.

**2. Idempotent state transitions: return a result instead of reverting when state is already at the target.**

Functions that change state should succeed silently when the state is already what was requested, and signal the no-op through a return value. This allows callers to override and add requirements, but they cannot remove a requirement the base contract already enforces. Example from `AccessControl._revokeRole`:

```solidity
function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
    if (hasRole(role, account)) {
        _roles[role].hasRole[account] = false;
        emit RoleRevoked(role, account, _msgSender());
        return true;
    } else {
        return false;  // already revoked (no-op, no revert)
    }
}
```

The caller can check the return value and add a `revert` if they need strict behavior. The base contract never takes that choice away from them.

**3. Empty virtual hooks: pure extension points with no base logic.**

Empty `internal virtual {}` functions are valid extension points when a useful callback location exists but the base contract has no default behavior to provide. Always `_camelCase`, always `internal virtual`, always documented with `@dev`:

```solidity
/// @dev Hook called every time the tally for a proposal is updated.
function _tallyUpdated(uint256 proposalId) internal virtual {}
```

**Rule of thumb:** if a function can do nothing without creating a security concern, it should do nothing. Overrides can always add requirements on top of a no-op base, but they cannot remove a requirement that the base already enforces.

### The `_update` single-override-point pattern

`_mint`, `_burn`, `_transfer` are non-virtual convenience functions that delegate to a single `virtual _update(...)`. Extensions override `_update`, never the individual operations. Always call `super._update(...)` without exception before adding side effects:

```solidity
function _update(address from, address to, uint256 value) internal virtual override {
  super._update(from, to, value); // base logic first
  _transferVotingUnits(from, to, value); // side effects after
}
```

### Internal / external split

The only job of a `public` function is to (1) capture `_msgSender()` and (2) delegate to an `internal` function. Application logic lives in the `internal` variant, which takes the actor address as an explicit parameter:

```solidity
function transfer(address to, uint256 value) public virtual returns (bool) {
  address owner = _msgSender();
  _transfer(owner, to, value);
  return true;
}
```

This keeps internal functions composable, testable, and independently overridable.

---

## 2. Error handling

Prefer `if (condition) revert CustomError(args)` for compatibility across chains that may not support all opcodes required by newer pragma versions. `require(condition, CustomError())` (available via IR in `^0.8.26`, normal in `^0.8.27`) is acceptable only when the file's pragma already requires that version and the usage is consistent with the rest of the file. Do not introduce a pragma bump just to use `require` with custom errors.

The broader pragma policy: avoid bumping the minimum version quickly. New versions can introduce opcodes not yet supported on all major chains (e.g. `0.8.24` introduced `mcopy`). Check whether a new opcode is widely supported before bumping.

Custom errors must:

- Follow the [ERC-6093](https://eips.ethereum.org/EIPS/eip-6093) rationale for naming and arguments.
- Use the domain prefix in this order:
  1. `ERC<number>` if the error is a violation of an ERC specification.
  2. The name of the underlying component otherwise (e.g. `Governor`, `ECDSA`, `Timelock`).
- Include the offending value(s) as arguments so callers can decode the failure context.
- Never be declared more than once across the library: duplicate error names cause identifier conflicts when inheriting from multiple contracts.

Error location priority:

1. Take errors from the underlying ERC if already defined there.
2. Declare in the interface or library if the error belongs to that context.
3. Declare in the implementation if the interface/library is not suitable (e.g. already specified by an ERC).
4. Declare in an extension if the error only occurs in that extension.

---

## 3. `_msgSender()` vs `msg.sender`

Use `_msgSender()` in application logic. `msg.sender` appears only inside `Context.sol` and `ERC2771Context.sol`: the meta-transaction layer. In deliberate exceptions where meta-transaction support does not apply by protocol design (e.g. `ERC7786Recipient.receiveMessage`, where only a specific gateway contract calls in and wrapping the sender would break the protocol). Deliberate uses of `msg.sender` outside the Context layer must have a `NOTE:` comment explaining why.

---

## 4. NatSpec

`@dev` is the only tag rendered by the OZ documentation engine. Use it as the primary tag. `@notice`, `@param`, and `@return` appear mainly in interface files where ERC specifications are kept as-is. Do not add `@notice` to implementation contracts: it will not appear in generated docs.

- Use `/// @dev` for single-line comments.
- Use `/** @dev ... */` for multi-line comments.
- Document everything: public, internal, and private functions; events; errors; constructors.

For overrides:

- Pure relay with nothing to add: `/// @inheritdoc InterfaceName`
- Override with added requirements or caveats: `/** @dev See {Interface-functionName}. \n\n Requirements: ... */`

Cross-references use `{ContractName-functionName}` syntax: `{IERC20-transfer}`, `{_update}`.

Use prose section headers inside `@dev` blocks: `Requirements:`, `NOTE:`, `WARNING:`, `IMPORTANT:`.

---

## 5. ERC-7201 namespaced storage

ERC-7201 is **not a general pattern** in this repository. Upgradeable variants of contracts are auto-generated by the [OpenZeppelin Transpiler](https://github.com/OpenZeppelin/openzeppelin-transpiler) from `scripts/upgradeable/transpile.sh`. Do not manually write upgradeable storage patterns for contracts that do not already use them.

ERC-7201 is used only in specific cases where namespacing is genuinely necessary, such as `Initializable.sol`, where placing the `_initialized` flag in sequential slot 0 would be risky for contracts used as proxy implementations. Any new use of ERC-7201 must have a clear justification in the NatSpec.

When ERC-7201 is appropriate, the required pattern is:

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

Rules: struct annotated with `@custom:storage-location`, inline formula comment mandatory above the constant, storage pointer variable always named `$`, `solhint-disable-next-line var-name-mixedcase` required before any function using `$`, constant named in `ALL_CAPS`. Never compute slot values by hand and verify with `SlotDerivation.erc7201Slot()`.

---

## 6. Assembly

**Always** annotate `assembly ("memory-safe")`. Omitting this annotation disables Solidity compiler optimizations (specifically the memory optimizer) and increases gas costs.

Include inline comments for any non-trivial operation.

---

## 7. Events

Emit events after state changes. Name in `PastTense` verb form (`Transfer`, `OwnershipTransferred`). Standard ERC events use present tense by specification (e.g. ERC-20's `Transfer`): follow the spec there. Define events in the interface or at the top of the emitting contract.

---

## 8. Numeric literals in assembly

Memory-related operations use hexadecimal: `mload(0x40)`, `mstore(add(ptr, 0x20), value)`. Bit operation amounts use decimal: `shl(128, value)`. Trivially small values (1, 2) may use decimal even in memory contexts.

---

## 9. Immutables, constants, and the transpiler annotation

| Keyword     | When                                                       | Naming                               |
| ----------- | ---------------------------------------------------------- | ------------------------------------ |
| `constant`  | Compile-time known (type hashes, role ids, slot addresses) | `ALL_CAPS_WITH_UNDERSCORES`          |
| `immutable` | Constructor-set, deploy-time computed                      | `_camelCase` (same as private state) |

`/// @custom:oz-upgrades-unsafe-allow state-variable-immutable` tells the transpiler to keep a variable as `immutable` in the generated upgradeable version, rather than converting it to a mutable state variable. Use it only when the value genuinely must not change across upgrades for security or correctness reasons. Example: `ERC2771Context._trustedForwarder` must remain immutable because changing it in an upgrade could introduce an untrusted forwarder and compromise the contract's security. Example of where it should NOT be used: `GovernorVotes._token`, which a governance system might legitimately want to change in an upgrade.

---

## 10. Casting

Any narrowing integer cast (e.g. `uint256 -> uint48`) must use `SafeCast.toUintXX()`. Direct Solidity casts are only permitted after an explicit bounds check you can point to.

---

## 11. `unchecked` blocks

Use `unchecked` only when a preceding condition makes overflow provably impossible. Include an inline comment explaining the invariant (from GUIDELINES.md: the comment may be omitted only if the reason is immediately apparent from the line immediately above):

```solidity
unchecked {
    // Overflow not possible: value <= fromBalance <= totalSupply.
    _balances[from] = fromBalance - value;
}
```

---

## 12. Inheritance ordering

The relative ordering of base contracts in any `is A, B, C` list must be globally consistent across the entire library. A CI check (`scripts/checks/inheritance-ordering.js`) detects any inconsistency where contract X appears before Y in one linearization but after Y in another. If you add or modify an `is` list, verify with `npm run compile && node scripts/checks/inheritance-ordering.js <artifact>` or check CI output.

---

## 13. `super` and extension contracts

`super` must always be called in `_update` overrides, in `supportsInterface` overrides, and whenever an extension builds on base behavior. Skipping `super` is only acceptable for brand-new functions with no base implementation.

`supportsInterface` always: `interfaceId == type(X).interfaceId || super.supportsInterface(interfaceId)`.

When overriding from multiple bases, list all: `override(A, B)`.

---

## 14. What to always verify manually (do not trust AI output)

- **Cryptographic operations**: hashing, ECDSA, elliptic curve math, anything in `contracts/utils/cryptography/`.
- **ERC-7201 slot derivations**: recompute with `SlotDerivation.erc7201Slot()` and compare against the constant.
- **Storage layout of any contract the transpiler will process**: adding, removing, or reordering fields breaks proxied deployments.
- **`delegatecall` and low-level assembly**: verify memory safety and stack usage manually.
- **`unchecked` blocks**: verify the stated invariant holds for all code paths.
- **Access control on `_authorizeUpgrade`**: must always be restricted; it is virtual and empty by design.
- **`_disableInitializers()` in implementation constructors**: must be present on any contract deployed as a UUPS or Transparent proxy implementation.
- **Pragma bumps**: verify new opcodes used by the compiler version are supported on all major target chains before approving.

---

## 15. Testing and mock contracts

### Accessing internal functions — hardhat-exposed

`$`-prefixed wrapper contracts are **auto-generated** by [hardhat-exposed](https://github.com/frangio/hardhat-exposed). The plugin creates a `$ContractName` for every contract in `contracts-exposed/` (gitignored), exposing every `_internal` function as an external `$_function`. Tests use these directly:

```javascript
const token = await ethers.deployContract('$ERC20', ['Name', 'SYM']);
await token.$_mint(holder, 1000n);
```

Do not write `$`-prefixed wrapper contracts by hand.

### Manual mocks in `contracts/mocks/`

Manual mocks are only written when the auto-generated exposed contract is not sufficient. `contracts/mocks/` mirrors the `contracts/` directory structure. Write a manual mock only when you need:

- **Constructor-level setup** — e.g. `ERC721ConsecutiveMock` which calls `_mintConsecutive` during construction.
- **Multi-extension composition** — e.g. combining `ERC721Consecutive + ERC721Pausable + ERC721Votes` to test their interaction.
- **Injected behavior** — e.g. `ERC20Reentrant` which overrides `_update` to fire a reentrant call at a specific point.
- **Adversarial or protocol-specific behavior** — e.g. `ReentrancyAttack`, `ERC20ReturnFalseMock`.
- **A plain public entry point** for an internal operation where the generated signature or constructor is unsuitable.

Even within a manual mock, call the auto-generated `$_` functions rather than re-declaring the same internal exposure.

### When to use each testing approach

| Approach | Required when |
|---|---|
| Formal verification | Contract includes a state machine or access control rules |
| Fuzzing | Math-heavy code, data structures, or complex invariants not suited for formal verification |
| Edge unit cases | All high-risk contracts, unexpected/pathological inputs, border cases |

### Halmos (symbolic execution)

[Halmos](https://github.com/a16z/halmos) runs symbolic execution on Foundry test files. Functions must be prefixed `symbolic` or `testSymbolic` to be picked up by the CI `halmos` job (`--match-test '^symbolic|^testSymbolic'`). They also run as regular fuzz tests under Foundry. Prefer Halmos when the property can be expressed as a Foundry test — it runs on every PR with no external credentials.

### Certora (rule-based formal verification)

[Certora](https://certora.com) specs live in `fv/specs/` as `.conf` + `.spec` pairs. The CI job runs on PRs labeled `formal-verification`. To run locally, apply harness patches first (`make -C fv apply`), then `node fv/run.js <SpecName>`. Use Certora for properties too complex for Halmos, or when deeper state machine coverage is needed. Requires a `CERTORAKEY`.

### Changesets

Every PR that changes contract behavior needs a changeset. Generate one with:

```bash
npx changeset add
```

Select `patch` for bug fixes, `minor` for new features. Write a single sentence starting with the backtick-quoted component name: `` `ERC20`: Add `transferWithCallback` extension. ``

---

## 16. Out of scope for AI

- API design decisions (naming, whether a feature belongs in the library): open an issue or PR.
- Security assessments or audit opinions.
- Generating new ERC interfaces or standards without explicit direction.
- Changing test structure without a corresponding contract change.
