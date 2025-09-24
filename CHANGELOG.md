# Changelog

### Bug fixes

- `ERC165Checker`: Ensure the `supportsERC165` function returns false if the target reverts during the `supportsInterface(0xffffffff)` call. ([#5810](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5880))

### Breaking changes

- `ERC6909` and the its extensions (`ERC6909ContentURI`, `ERC6909Metadata` and `ERC6909TokenSupply`) are no longer marked as draft since [EIP-6909](https://eips.ethereum.org/EIPS/eip-6909) is now final. Developers must update the import paths. Contracts behavior is not modified.
- `SignerERC7702` is renamed as `SignerEIP7702`. Imports and inheritance must be updated to that new name and path. Behavior is unmodified.
- `ERC721Holder`, `ERC1155Holder`, `ReentrancyGuard` and `ReentrancyGuardTransient` are flagged as stateless and are no longer transpiled. Developers using their upgradeable variants from `@openzeppelin/contracts-upgradeable` must update their imports to use the equivalent version available in `@openzeppelin/contracts`.
- Update minimum pragma to 0.8.24 in `Votes`, `VotesExtended`, `ERC20Votes`, `Strings`, `ERC1155URIStorage`, `MessageHashUtils`, `ERC721URIStorage`, `ERC721Votes`, `ERC721Wrapper`, `ERC721Burnable`, `ERC721Consecutive`, `ERC721Enumerable`, `ERC721Pausable`, `ERC721Royalty`, `ERC721Wrapper`, `EIP712`, `ERC4626` and `ERC7739`. ([#5726](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5726))

### Deprecation

- `Initializable` and `UUPSUpgradeable` are no longer transpiled. An alias is present in the `@openzeppelin/contracts-upgradeable` package that redirect to the corresponding file in `@openzeppelin/contracts`. These alias will be removed in the next major release. Developers are advised to update their imports to get these files directly from the `@openzeppelin/contracts` package.
- `ECDSA` signature malleability protection is partly deprecated. See documentation for more details.

## 5.4.0 (2025-07-17)

### Breaking changes

- Update minimum pragma to 0.8.24 in `SignatureChecker`, `Governor` and Governor's extensions. ([#5716](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5716)).

### Pragma changes

- Reduced pragma requirement of interface files

### Changes by category

#### Account

- `Account`: Added a simple ERC-4337 account implementation with minimal logic to process user operations. ([#5657](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5657))
- `AccountERC7579`: Extension of `Account` that implements support for ERC-7579 modules of type executor, validator, and fallback handler. ([#5657](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5657))
- `AccountERC7579Hooked`: Extension of `AccountERC7579` that implements support for ERC-7579 hook modules. ([#5657](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5657))
- `EIP7702Utils`: Add a library for checking if an address has an EIP-7702 delegation in place. ([#5587](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5587))
- `IERC7821`, `ERC7821`: Interface and logic for minimal batch execution. No support for additional `opData` is included. ([#5657](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5657))

#### Governance

- `GovernorNoncesKeyed`: Extension of `Governor` that adds support for keyed nonces when voting by sig. ([#5574](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5574))

#### Tokens

- `ERC20Bridgeable`: Implementation of ERC-7802 that makes an ERC-20 compatible with crosschain bridges. ([#5739](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5739))

#### Cryptography

##### Signers

- `AbstractSigner`, `SignerECDSA`, `SignerP256`, and `SignerRSA`: Add an abstract contract and various implementations for contracts that deal with signature verification. ([#5657](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5657))
- `SignerERC7702`: Implementation of `AbstractSigner` for Externally Owned Accounts (EOAs). Useful with ERC-7702. ([#5657](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5657))
- `SignerERC7913`: Abstract signer that verifies signatures using the ERC-7913 workflow. ([#5659](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5659))
- `MultiSignerERC7913`: Implementation of `AbstractSigner` that supports multiple ERC-7913 signers with a threshold-based signature verification system. ([#5659](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5659))
- `MultiSignerERC7913Weighted`: Extension of `MultiSignerERC7913` that supports assigning different weights to each signer, enabling more flexible governance schemes. ([#5741](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5741))

##### Verifiers

- `ERC7913P256Verifier` and `ERC7913RSAVerifier`: Ready to use ERC-7913 verifiers that implement key verification for P256 (secp256r1) and RSA keys. ([#5659](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5659))

##### Other

- `SignatureChecker`: Add support for ERC-7913 signatures alongside existing ECDSA and ERC-1271 signature verification. ([#5659](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5659))
- `ERC7739`: An abstract contract to validate signatures following the rehashing scheme from `ERC7739Utils`. ([#5664](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5664))
- `ERC7739Utils`: Add a library that implements a defensive rehashing mechanism to prevent replayability of smart contract signatures based on the ERC-7739. ([#5664](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5664))

#### Structures

- `EnumerableMap`: Add support for `BytesToBytesMap` type. ([#5658](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5658))
- `EnumerableMap`: Add `keys(uint256,uint256)` that returns a subset (slice) of the keys in the map. ([#5713](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5713))
- `EnumerableSet`: Add support for `StringSet` and `BytesSet` types. ([#5658](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5658))
- `EnumerableSet`: Add `values(uint256,uint256)` that returns a subset (slice) of the values in the set. ([#5713](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5713))

#### Utils

- `Arrays`: Add `unsafeAccess`, `unsafeMemoryAccess` and `unsafeSetLength` for `bytes[]` and `string[]`. ([#5568](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5568))
- `Blockhash`: Add a library that provides access to historical block hashes using EIP-2935's history storage, extending the standard 256-block limit to 8191 blocks. ([#5642](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5642))
- `Bytes`: Fix `lastIndexOf(bytes,byte,uint256)` with empty buffers and finite position to correctly return `type(uint256).max` instead of accessing uninitialized memory sections. ([#5797](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5797))

## 5.3.0 (2025-04-09)

### Breaking Changes

- Replace `GovernorCountingOverridable.VoteReceipt` struct parameter member names `hasOverriden` and `overridenWeight` for `hasOverridden` and `overriddenWeight` respectively.

#### Custom error changes

- Replace `GovernorAlreadyOverridenVote` with `GovernorAlreadyOverriddenVote`.
- Replace `GovernorOnlyProposer` with `GovernorUnableToCancel`.

### Changes by category

#### Account

- `ERC4337Utils`: Update the `hash` function to call `getUserOpHash` on the specified entrypoint and add an `ENTRYPOINT_V08` constant. ([#5614](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5614))
- `ERC7579Utils`: Add ABI decoding checks on calldata bounds within `decodeBatch`. ([#5371](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5371))
- `ERC7579Utils`: Replace `address(0)` with `address(this)` during execution for calldata compression efficiency. ([#5614](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5614))

#### Governance

- `IGovernor`: Add the `getProposalId` function to the governor interface. ([#5290](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5290))
- `GovernorProposalGuardian`: Add a governance extension that defines a proposal guardian who can cancel proposals at any stage in their lifecycle. ([#5303](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5303))
- `GovernorSequentialProposalId`: Adds a `Governor` extension that sequentially numbers proposal ids instead of using the hash. ([#5290](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5290))
- `GovernorSuperQuorum`: Add a governance extension to support a super quorum. Proposals that meet the super quorum (and have a majority of for votes) advance to the `Succeeded` state before the proposal deadline. ([#5526](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5526))
- `GovernorVotesSuperQuorumFraction`: Add a variant of the `GovernorSuperQuorum` extensions where the super quorum is expressed as a fraction of the total supply. ([#5526](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5526))
- `TimelockController`: Receive function is now virtual. ([#5509](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5509))

#### Structures

- `EnumerableSet`: Add `clear` function to EnumerableSets which deletes all values in the set. ([#5486](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5486))
- `EnumerableMap`: Add `clear` function to EnumerableMaps which deletes all entries in the map. ([#5486](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5486))
- `MerkleTree`: Add an update function that replaces a previously inserted leaf with a new value, updating the tree root along the way. ([#5526](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5526))

#### Tokens

- `ERC4626`: Use the `asset` getter in `totalAssets`, `_deposit` and `_withdraw`. ([#5322](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5322))
- `IERC6909`: Add the interface for ERC-6909. ([#5343](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5343))
- `ERC6909`: Add a standard implementation of ERC6909. ([#5394](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5394))
- `ERC6909TokenSupply`: Add an extension of ERC6909 which tracks total supply for each token id. ([#5394](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5394))
- `ERC6909Metadata`: Add an extension of ERC6909 which adds metadata functionality. ([#5394](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5394))
- `ERC6909ContentURI`: Add an extension of ERC6909 which adds content URI functionality. ([#5394](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5394))
- `SafeERC20`: Add `trySafeTransfer` and `trySafeTransferFrom` that do not revert and return false if the transfer is not successful. ([#5483](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5483))

#### Other

- `Address`: bubble up revert data on `sendValue` failed call. ([#5379](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5379))
- `Calldata`: Library with `emptyBytes` and `emptyString` functions to generate empty `bytes` and `string` calldata types. ([#5422](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5422))
- `ERC2771Forwarder`: Expose the `_isTrustedByTarget` internal function to check whether a target trusts the forwarder. ([#5416](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5416))
- `Hashes`: Expose `efficientKeccak256` for hashing non-commutative pairs of bytes32 without allocating extra memory. ([#5442](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5442))
- `Initializable`: Add `_initializableStorageSlot` function that returns a pointer to the storage struct. The function allows customizing with a custom storage slot with an `override`. ([#5526](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5526))
- `Math`: Add `add512`, `mul512` and `mulShr`. ([#5526](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5526))
- `Math`: Add saturating arithmetic operations `saturatingAdd`, `saturatingSub` and `saturatingMul`. ([#5526](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5526))
- `MessageHashUtils`: Add `toDataWithIntendedValidatorHash(address, bytes32)`. ([#5526](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5526))
- `P256`: Adjust precompile detection in `verifyNative` to consider empty `returndata` on invalid verification. Previously, invalid signatures would've reverted with a `MissingPrecompile` error in chains with RIP-7212 support. ([#5620](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5620))
- `Pausable`: Stop explicitly setting `paused` to `false` during construction. ([#5448](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5448))
- `Strings`: Add `espaceJSON` that escapes special characters in JSON strings. ([#5526](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5526))

## 5.2.0 (2025-01-08)

### Breaking Changes

#### Custom error changes

This version comes with changes to the custom error identifiers. Contracts previously depending on the following errors should be replaced accordingly:

- Replace `Errors.FailedCall` with a bubbled-up revert reason in `Address.sendValue`.

### Changes by category

#### General

- Update some pragma directives to ensure that all file requirements match that of the files they import. ([#5273](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5273))

#### Account

- `ERC4337Utils`: Add a reusable library to manipulate user operations and interact with ERC-4337 contracts ([#5274](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5274))
- `ERC7579Utils`: Add a reusable library to interact with ERC-7579 modular accounts ([#5274](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5274))

#### Governance

- `GovernorCountingOverridable`: Add a governor counting module that enables token holders to override the vote of their delegate. ([#5192](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5192))
- `VotesExtended`: Create an extension of `Votes` which checkpoints balances and delegates. ([#5192](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5192))

### Proxy

- `Clones`: Add `cloneWithImmutableArgs` and `cloneDeterministicWithImmutableArgs` variants that create clones with per-instance immutable arguments. The immutable arguments can be retrieved using `fetchCloneArgs`. The corresponding `predictDeterministicWithImmutableArgs` function is also included. ([#5109](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5109))

### Tokens

- `ERC1363Utils`: Add helper similar to the existing `ERC721Utils` and `ERC1155Utils` ([#5133](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5133))

### Utils

- `Address`: bubble up revert data on `sendValue` failed call ([#5418](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5418))
- `Bytes`: Add a library of common operations that operate on `bytes` objects. ([#5252](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5252))
- `CAIP2` and `CAIP10`: Add libraries for formatting and parsing CAIP-2 and CAIP-10 identifiers. ([#5252](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5252))
- `NoncesKeyed`: Add a variant of `Nonces` that implements the ERC-4337 entrypoint nonce system. ([#5272](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5272))
- `Packing`: Add variants for packing `bytes10` and `bytes22` ([#5274](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5274))
- `Strings`: Add `parseUint`, `parseInt`, `parseHexUint` and `parseAddress` to parse strings into numbers and addresses. Also provide variants of these functions that parse substrings, and `tryXxx` variants that do not revert on invalid input. ([#5166](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5166))

## 5.1.0 (2024-10-17)

### Breaking changes

- `ERC1967Utils`: Removed duplicate declaration of the `Upgraded`, `AdminChanged` and `BeaconUpgraded` events. These events are still available through the `IERC1967` interface located under the `contracts/interfaces/` directory. Minimum pragma version is now 0.8.21.
- `Governor`, `GovernorCountingSimple`: The `_countVote` virtual function now returns an `uint256` with the total votes cast. This change allows for more flexibility for partial and fractional voting. Upgrading users may get a compilation error that can be fixed by adding a return statement to the `_countVote` function.

#### Custom error changes

This version comes with changes to the custom error identifiers. Contracts previously depending on the following errors should be replaced accordingly:

- Replace `Address.FailedInnerCall` with `Errors.FailedCall`
- Replace `Address.AddressInsufficientBalance` with `Errors.InsufficientBalance`
- Replace `Clones.Create2InsufficientBalance` with `Errors.InsufficientBalance`
- Replace `Clones.ERC1167FailedCreateClone` with `Errors.FailedDeployment`
- Replace `Clones.Create2FailedDeployment` with `Errors.FailedDeployment`
- `SafeERC20`: Replace `Address.AddressEmptyCode` with `SafeERC20FailedOperation` if there is no code at the token's address.
- `SafeERC20`: Replace generic `Error(string)` with `SafeERC20FailedOperation` if the returned data can't be decoded as `bool`.
- `SafeERC20`: Replace generic `SafeERC20FailedOperation` with the revert message from the contract call if it fails.

### Changes by category

#### General

- `AccessManager`, `VestingWallet`, `TimelockController` and `ERC2771Forwarder`: Added a public `initializer` function in their corresponding upgradeable variants. ([#5008](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5008))

#### Access

- `AccessControlEnumerable`: Add a `getRoleMembers` method to return all accounts that have `role`. ([#4546](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4546))
- `AccessManager`: Allow the `onlyAuthorized` modifier to restrict functions added to the manager. ([#5014](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5014))

#### Finance

- `VestingWalletCliff`: Add an extension of the `VestingWallet` contract with an added cliff. ([#4870](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4870))

#### Governance

- `GovernorCountingFractional`: Add a governor counting module that allows distributing voting power amongst 3 options (For, Against, Abstain). ([#5045](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5045))
- `Votes`: Set `_moveDelegateVotes` visibility to internal instead of private. ([#5007](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5007))

#### Proxy

- `Clones`: Add version of `clone` and `cloneDeterministic` that support sending value at creation. ([#4936](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4936))
- `TransparentUpgradeableProxy`: Make internal `_proxyAdmin()` getter have `view` visibility. ([#4688](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4688))
- `ProxyAdmin`: Fixed documentation for `UPGRADE_INTERFACE_VERSION` getter. ([#5031](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5031))

#### Tokens

- `ERC1363`: Add implementation of the token payable standard allowing execution of contract code after transfers and approvals. ([#4631](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4631))
- `ERC20TemporaryApproval`: Add an ERC-20 extension that implements temporary approval using transient storage, based on ERC7674 (draft). ([#5071](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5071))
- `SafeERC20`: Add "relaxed" function for interacting with ERC-1363 functions in a way that is compatible with EOAs. ([#4631](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4631))
- `SafeERC20`: Document risks of `safeIncreaseAllowance` and `safeDecreaseAllowance` when associated with ERC-7674. ([#5262](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5262))
- `ERC721Utils` and `ERC1155Utils`: Add reusable libraries with functions to perform acceptance checks on `IERC721Receiver` and `IERC1155Receiver` implementers. ([#4845](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4845))
- `ERC1363Utils`: Add helper similar to the existing ERC721Utils and ERC1155Utils. ([#5133](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5133))

#### Utils

- `Arrays`: add a `sort` functions for `address[]`, `bytes32[]` and `uint256[]` memory arrays. ([#4846](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4846))
- `Arrays`: add new functions `lowerBound`, `upperBound`, `lowerBoundMemory` and `upperBoundMemory` for lookups in sorted arrays with potential duplicates. ([#4842](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4842))
- `Arrays`: deprecate `findUpperBound` in favor of the new `lowerBound`. ([#4842](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4842))
- `Base64`: Add `encodeURL` following section 5 of RFC4648 for URL encoding ([#4822](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4822))
- `Comparator`: A library of comparator functions, useful for customizing the behavior of the Heap structure. ([#5084](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5084))
- `Create2`: Bubbles up returndata from a deployed contract that reverted during construction. ([#5052](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5052))
- `Create2`, `Clones`: Mask `computeAddress` and `cloneDeterministic` outputs to produce a clean value for an `address` type (i.e. only use 20 bytes) ([#4941](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4941))
- `Errors`: New library of common custom errors. ([#4936](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4936))
- `Hashes`: A library with commonly used hash functions. ([#3617](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3617))
- `Packing`: Added a new utility for packing, extracting and replacing bytesXX values. ([#4992](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4992))
- `Panic`: Add a library for reverting with panic codes. ([#3298](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3298))
- `ReentrancyGuardTransient`: Added a variant of `ReentrancyGuard` that uses transient storage. ([#4988](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4988))
- `Strings`: Added a utility function for converting an address to checksummed string. ([#5067](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5067))
- `SlotDerivation`: Add a library of methods for derivating common storage slots. ([#4975](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4975))
- `TransientSlot`: Add primitives for operating on the transient storage space using a typed-slot representation. ([#4980](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4980))

##### Cryptography

- `SignatureChecker`: refactor `isValidSignatureNow` to avoid validating ECDSA signatures if there is code deployed at the signer's address. ([#4951](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4951))
- `MerkleProof`: Add variations of `verify`, `processProof`, `multiProofVerify` and `processMultiProof` (and equivalent calldata version) with support for custom hashing functions. ([#4887](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4887))
- `P256`: Library for verification and public key recovery of P256 (aka secp256r1) signatures. ([#4881](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4881))
- `RSA`: Library to verify signatures according to RFC 8017 Signature Verification Operation ([#4952](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4952))

#### Math

- `Math`: add an `invMod` function to get the modular multiplicative inverse of a number in Z/nZ. ([#4839](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4839))
- `Math`: Add `modExp` function that exposes the `EIP-198` precompile. Includes `uint256` and `bytes memory` versions. ([#3298](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3298))
- `Math`: Custom errors replaced with native panic codes. ([#3298](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3298))
- `Math`, `SignedMath`: Add a branchless `ternary` function that computes`cond ? a : b` in constant gas cost. ([#4976](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4976))
- `SafeCast`: Add `toUint(bool)` for operating on `bool` values as `uint256`. ([#4878](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4878))

#### Structures

- `CircularBuffer`: Add a data structure that stores the last `N` values pushed to it. ([#4913](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4913))
- `DoubleEndedQueue`: Custom errors replaced with native panic codes. ([#4872](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4872))
- `EnumerableMap`: add `UintToBytes32Map`, `AddressToAddressMap`, `AddressToBytes32Map` and `Bytes32ToAddressMap`. ([#4843](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4843))
- `Heap`: A data structure that implements a heap-based priority queue. ([#5084](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/5084))
- `MerkleTree`: A data structure that allows inserting elements into a merkle tree and updating its root hash. ([#3617](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3617))

## 5.0.2 (2024-02-29)

- `Base64`: Fix issue where dirty memory located just after the input buffer is affecting the result. ([#4926](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4926))

## 5.0.1 (2023-12-07)

- `ERC2771Context` and `Context`: Introduce a `_contextPrefixLength()` getter, used to trim extra information appended to `msg.data`.
- `Multicall`: Make aware of non-canonical context (i.e. `msg.sender` is not `_msgSender()`), allowing compatibility with `ERC2771Context`.

## 5.0.0 (2023-10-05)

### Additions Summary

The following contracts and libraries were added:

- `AccessManager`: A consolidated system for managing access control in complex systems.
  - `AccessManaged`: A module for connecting a contract to an authority in charge of its access control.
  - `GovernorTimelockAccess`: An adapter for time-locking governance proposals using an `AccessManager`.
  - `AuthorityUtils`: A library of utilities for interacting with authority contracts.
- `GovernorStorage`: A Governor module that stores proposal details in storage.
- `ERC2771Forwarder`: An ERC2771 forwarder for meta transactions.
- `ERC1967Utils`: A library with ERC1967 events, errors and getters.
- `Nonces`: An abstraction for managing account nonces.
- `MessageHashUtils`: A library for producing digests for ECDSA operations.
- `Time`: A library with helpers for manipulating time-related objects.

### Removals Summary

The following contracts, libraries, and functions were removed:

- `Address.isContract` (because of its ambiguous nature and potential for misuse)
- `Checkpoints.History`
- `Counters`
- `ERC20Snapshot`
- `ERC20VotesComp`
- `ERC165Storage` (in favor of inheritance based approach)
- `ERC777`
- `ERC1820Implementer`
- `GovernorVotesComp`
- `GovernorProposalThreshold` (deprecated since 4.4)
- `PaymentSplitter`
- `PullPayment`
- `SafeMath`
- `SignedSafeMath`
- `Timers`
- `TokenTimelock` (in favor of `VestingWallet`)
- All escrow contracts (`Escrow`, `ConditionalEscrow` and `RefundEscrow`)
- All cross-chain contracts, including `AccessControlCrossChain` and all the vendored bridge interfaces
- All presets in favor of [OpenZeppelin Contracts Wizard](https://wizard.openzeppelin.com/)

These removals were implemented in the following PRs: [#3637](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3637), [#3880](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3880), [#3945](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3945), [#4258](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4258), [#4276](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4276), [#4289](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4289)

### Changes by category

#### General

- Replaced revert strings and require statements with custom errors. ([#4261](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4261))
- Bumped minimum compiler version required to 0.8.20 ([#4288](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4288), [#4489](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4489))
- Use of `abi.encodeCall` in place of `abi.encodeWithSelector` and `abi.encodeWithSignature` for improved type-checking of parameters ([#4293](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4293))
- Replaced some uses of `abi.encodePacked` with clearer alternatives (e.g. `bytes.concat`, `string.concat`). ([#4504](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4504)) ([#4296](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4296))
- Overrides are now used internally for a number of functions that were previously hardcoded to their default implementation in certain locations: `ERC1155Supply.totalSupply`, `ERC721.ownerOf`, `ERC721.balanceOf` and `ERC721.totalSupply` in `ERC721Enumerable`, `ERC20.totalSupply` in `ERC20FlashMint`, and `ERC1967._getImplementation` in `ERC1967Proxy`. ([#4299](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4299))
- Removed the `override` specifier from functions that only override a single interface function. ([#4315](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4315))
- Switched to using explicit Solidity import statements. Some previously available symbols may now have to be separately imported. ([#4399](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4399))
- `Governor`, `Initializable`, and `UUPSUpgradeable`: Use internal functions in modifiers to optimize bytecode size. ([#4472](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4472))
- Upgradeable contracts now use namespaced storage (EIP-7201). ([#4534](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4534))
- Upgradeable contracts no longer transpile interfaces and libraries. ([#4628](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4628))

#### Access

- `Ownable`: Added an `initialOwner` parameter to the constructor, making the ownership initialization explicit. ([#4267](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4267))
- `Ownable`: Prevent using address(0) as the initial owner. ([#4531](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4531))
- `AccessControl`: Added a boolean return value to the internal `_grantRole` and `_revokeRole` functions indicating whether the role was granted or revoked. ([#4241](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4241))
- `access`: Moved `AccessControl` extensions to a dedicated directory. ([#4359](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4359))
- `AccessManager`: Added a new contract for managing access control of complex systems in a consolidated location. ([#4121](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4121))
- `AccessManager`, `AccessManaged`, `GovernorTimelockAccess`: Ensure that calldata shorter than 4 bytes is not padded to 4 bytes. ([#4624](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4624))
- `AccessManager`: Use named return parameters in functions that return multiple values. ([#4624](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4624))
- `AccessManager`: Make `schedule` and `execute` more conservative when delay is 0. ([#4644](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4644))

#### Finance

- `VestingWallet`: Fixed revert during 1 second time window when duration is 0. ([#4502](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4502))
- `VestingWallet`: Use `Ownable` instead of an immutable `beneficiary`. ([#4508](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4508))

#### Governance

- `Governor`: Optimized use of storage for proposal data ([#4268](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4268))
- `Governor`: Added validation in ERC1155 and ERC721 receiver hooks to ensure Governor is the executor. ([#4314](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4314))
- `Governor`: Refactored internals to implement common queuing logic in the core module of the Governor. Added `queue` and `_queueOperations` functions that act at different levels. Modules that implement queuing via timelocks are expected to override `_queueOperations` to implement the timelock-specific logic. Added `_executeOperations` as the equivalent for execution. ([#4360](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4360))
- `Governor`: Added `voter` and `nonce` parameters in signed ballots, to avoid forging signatures for random addresses, prevent signature replay, and allow invalidating signatures. Add `voter` as a new parameter in the `castVoteBySig` and `castVoteWithReasonAndParamsBySig` functions. ([#4378](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4378))
- `Governor`: Added support for casting votes with ERC-1271 signatures by using a `bytes memory signature` instead of `r`, `s` and `v` arguments in the `castVoteBySig` and `castVoteWithReasonAndParamsBySig` functions. ([#4418](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4418))
- `Governor`: Added a mechanism to restrict the address of the proposer using a suffix in the description.
- `GovernorStorage`: Added a new governor extension that stores the proposal details in storage, with an interface that operates on `proposalId`, as well as proposal enumerability. This replaces the old `GovernorCompatibilityBravo` module. ([#4360](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4360))
- `GovernorTimelockAccess`: Added a module to connect a governor with an instance of `AccessManager`, allowing the governor to make calls that are delay-restricted by the manager using the normal `queue` workflow. ([#4523](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4523))
- `GovernorTimelockControl`: Clean up timelock id on execution for gas refund. ([#4118](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4118))
- `GovernorTimelockControl`: Added the Governor instance address as part of the TimelockController operation `salt` to avoid operation id collisions between governors using the same TimelockController. ([#4432](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4432))
- `TimelockController`: Changed the role architecture to use `DEFAULT_ADMIN_ROLE` as the admin for all roles, instead of the bespoke `TIMELOCK_ADMIN_ROLE` that was used previously. This aligns with the general recommendation for `AccessControl` and makes the addition of new roles easier. Accordingly, the `admin` parameter and timelock will now be granted `DEFAULT_ADMIN_ROLE` instead of `TIMELOCK_ADMIN_ROLE`. ([#3799](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3799))
- `TimelockController`: Added a state getter that returns an `OperationState` enum. ([#4358](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4358))
- `Votes`: Use Trace208 for checkpoints. This enables EIP-6372 clock support for keys but reduces the max supported voting power to uint208. ([#4539](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4539))

#### Metatx

- `ERC2771Forwarder`: Added `deadline` for expiring transactions, batching, and more secure handling of `msg.value`. ([#4346](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4346))
- `ERC2771Context`: Return the forwarder address whenever the `msg.data` of a call originating from a trusted forwarder is not long enough to contain the request signer address (i.e. `msg.data.length` is less than 20 bytes), as specified by ERC-2771. ([#4481](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4481))
- `ERC2771Context`: Prevent revert in `_msgData()` when a call originating from a trusted forwarder is not long enough to contain the request signer address (i.e. `msg.data.length` is less than 20 bytes). Return the full calldata in that case. ([#4484](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4484))

#### Proxy

- `ProxyAdmin`: Removed `getProxyAdmin` and `getProxyImplementation` getters. ([#3820](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3820))
- `TransparentUpgradeableProxy`: Removed `admin` and `implementation` getters, which were only callable by the proxy owner and thus not very useful. ([#3820](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3820))
- `ERC1967Utils`: Refactored the `ERC1967Upgrade` abstract contract as a library. ([#4325](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4325))
- `TransparentUpgradeableProxy`: Admin is now stored in an immutable variable (set during construction) to avoid unnecessary storage reads on every proxy call. This removed the ability to ever change the admin. Transfer of the upgrade capability is exclusively handled through the ownership of the `ProxyAdmin`. ([#4354](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4354))
- Moved the logic to validate ERC-1822 during an upgrade from `ERC1967Utils` to `UUPSUpgradeable`. ([#4356](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4356))
- `UUPSUpgradeable`, `TransparentUpgradeableProxy` and `ProxyAdmin`: Removed `upgradeTo` and `upgrade` functions, and made `upgradeToAndCall` and `upgradeAndCall` ignore the data argument if it is empty. It is no longer possible to invoke the receive function (or send value with empty data) along with an upgrade. ([#4382](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4382))
- `BeaconProxy`: Reject value in initialization unless a payable function is explicitly invoked. ([#4382](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4382))
- `Proxy`: Removed redundant `receive` function. ([#4434](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4434))
- `BeaconProxy`: Use an immutable variable to store the address of the beacon. It is no longer possible for a `BeaconProxy` to upgrade by changing to another beacon. ([#4435](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4435))
- `Initializable`: Use the namespaced storage pattern to avoid putting critical variables in slot 0. Allow reinitializer versions greater than 256. ([#4460](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4460))
- `Initializable`: Use intermediate variables to improve readability. ([#4576](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4576))

#### Token

- `ERC20`, `ERC721`, `ERC1155`: Deleted `_beforeTokenTransfer` and `_afterTokenTransfer` hooks, added a new internal `_update` function for customizations, and refactored all extensions using those hooks to use `_update` instead. ([#3838](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3838), [#3876](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3876), [#4377](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4377))
- `ERC20`: Removed `Approval` event previously emitted in `transferFrom` to indicate that part of the allowance was consumed. With this change, allowances are no longer reconstructible from events. See the code for guidelines on how to re-enable this event if needed. ([#4370](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4370))
- `ERC20`: Removed the non-standard `increaseAllowance` and `decreaseAllowance` functions. ([#4585](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4585))
- `ERC20Votes`: Changed internal vote accounting to reusable `Votes` module previously used by `ERC721Votes`. Removed implicit `ERC20Permit` inheritance. Note that the `DOMAIN_SEPARATOR` getter was previously guaranteed to be available for `ERC20Votes` contracts, but is no longer available unless `ERC20Permit` is explicitly used; ERC-5267 support is included in `ERC20Votes` with `EIP712` and is recommended as an alternative. ([#3816](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3816))
- `SafeERC20`: Refactored `safeDecreaseAllowance` and `safeIncreaseAllowance` to support USDT-like tokens. ([#4260](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4260))
- `SafeERC20`: Removed `safePermit` in favor of documentation-only `permit` recommendations. Based on recommendations from @trust1995 ([#4582](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4582))
- `ERC721`: `_approve` no longer allows approving the owner of the tokenId. ([#4377](https://github.com/OpenZeppelin/openzeppelin-contracts/issues/4377)) `_setApprovalForAll` no longer allows setting address(0) as an operator. ([#4377](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4377))
- `ERC721`: Renamed `_requireMinted` to `_requireOwned` and added a return value with the current owner. Implemented `ownerOf` in terms of `_requireOwned`. ([#4566](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4566))
- `ERC721Consecutive`: Added a `_firstConsecutiveId` internal function that can be overridden to change the id of the first token minted through `_mintConsecutive`. ([#4097](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4097))
- `ERC721URIStorage`: Allow setting the token URI prior to minting. ([#4559](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4559))
- `ERC721URIStorage`, `ERC721Royalty`: Stop resetting token-specific URI and royalties when burning. ([#4561](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4561))
- `ERC1155`: Optimized array allocation. ([#4196](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4196))
- `ERC1155`: Removed check for address zero in `balanceOf`. ([#4263](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4263))
- `ERC1155`: Optimized array accesses by skipping bounds checking when unnecessary. ([#4300](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4300))
- `ERC1155`: Bubble errors triggered in the `onERC1155Received` and `onERC1155BatchReceived` hooks. ([#4314](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4314))
- `ERC1155Supply`: Added a `totalSupply()` function that returns the total amount of token circulating, this change will restrict the total tokens minted across all ids to 2\*\*256-1 . ([#3962](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3962))
- `ERC1155Receiver`: Removed in favor of `ERC1155Holder`. ([#4450](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4450))

#### Utils

- `Address`: Removed the ability to customize error messages. A common custom error is always used if the underlying revert reason cannot be bubbled up. ([#4502](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4502))
- `Arrays`: Added `unsafeMemoryAccess` helpers to read from a memory array without checking the length. ([#4300](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4300))
- `Arrays`: Optimized `findUpperBound` by removing redundant SLOAD. ([#4442](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4442))
- `Checkpoints`: Library moved from `utils` to `utils/structs` ([#4275](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4275))
- `DoubleEndedQueue`: Refactored internal structure to use `uint128` instead of `int128`. This has no effect on the library interface. ([#4150](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4150))
- `ECDSA`: Use unchecked arithmetic for the `tryRecover` function that receives the `r` and `vs` short-signature fields separately. ([#4301](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4301))
- `EIP712`: Added internal getters for the name and version strings ([#4303](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4303))
- `Math`: Makes `ceilDiv` to revert on 0 division even if the numerator is 0 ([#4348](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4348))
- `Math`: Optimized stack operations in `mulDiv`. ([#4494](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4494))
- `Math`: Renamed members of `Rounding` enum, and added a new rounding mode for "away from zero". ([#4455](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4455))
- `MerkleProof`: Use custom error to report invalid multiproof instead of reverting with overflow panic. ([#4564](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4564))
- `MessageHashUtils`: Added a new library for creating message digest to be used along with signing or recovery such as ECDSA or ERC-1271. These functions are moved from the `ECDSA` library. ([#4430](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4430))
- `Nonces`: Added a new contract to keep track of user nonces. Used for signatures in `ERC20Permit`, `ERC20Votes`, and `ERC721Votes`. ([#3816](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3816))
- `ReentrancyGuard`, `Pausable`: Moved to `utils` directory. ([#4551](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4551))
- `Strings`: Renamed `toString(int256)` to `toStringSigned(int256)`. ([#4330](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4330))
- Optimized `Strings.equal` ([#4262](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4262))

### How to migrate from 4.x

#### ERC20, ERC721, and ERC1155

These breaking changes will require modifications to ERC20, ERC721, and ERC1155 contracts, since the `_afterTokenTransfer` and `_beforeTokenTransfer` functions were removed. Thus, any customization made through those hooks should now be done overriding the new `_update` function instead.

Minting and burning are implemented by `_update` and customizations should be done by overriding this function as well. `_transfer`, `_mint` and `_burn` are no longer virtual (meaning they are not overridable) to guard against possible inconsistencies.

For example, a contract using `ERC20`'s `_beforeTokenTransfer` hook would have to be changed in the following way.

```diff
-function _beforeTokenTransfer(
+function _update(
   address from,
   address to,
   uint256 amount
 ) internal virtual override {
-  super._beforeTokenTransfer(from, to, amount);
   require(!condition(), "ERC20: wrong condition");
+  super._update(from, to, amount);
 }
```

#### More about ERC721

In the case of `ERC721`, the `_update` function does not include a `from` parameter, as the sender is implicitly the previous owner of the `tokenId`. The address of this previous owner is returned by the `_update` function, so it can be used for a posteriori checks. In addition to `to` and `tokenId`, a third parameter (`auth`) is present in this function. This parameter enabled an optional check that the caller/spender is approved to do the transfer. This check cannot be performed after the transfer (because the transfer resets the approval), and doing it before `_update` would require a duplicate call to `_ownerOf`.

In this logic of removing hidden SLOADs, the `_isApprovedOrOwner` function was removed in favor of a new `_isAuthorized` function. Overrides that used to target the `_isApprovedOrOwner` should now be performed on the `_isAuthorized` function. Calls to `_isApprovedOrOwner` that preceded a call to `_transfer`, `_burn` or `_approve` should be removed in favor of using the `auth` argument in `_update` and `_approve`. This is showcased in `ERC721Burnable.burn` and in `ERC721Wrapper.withdrawTo`.

The `_exists` function was removed. Calls to this function can be replaced by `_ownerOf(tokenId) != address(0)`.

#### More about ERC1155

Batch transfers will now emit `TransferSingle` if the batch consists of a single token, while in previous versions the `TransferBatch` event would be used for all transfers initiated through `safeBatchTransferFrom`. Both behaviors are compliant with the ERC-1155 specification.

#### ERC165Storage

Users that were registering EIP-165 interfaces with `_registerInterface` from `ERC165Storage` should instead do so by overriding the `supportsInterface` function as seen below:

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
  return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
}
```

#### SafeMath

Methods in SafeMath superseded by native overflow checks in Solidity 0.8.0 were removed along with operations providing an interface for revert strings. The remaining methods were moved to `utils/Math.sol`.

```diff
- import "@openzeppelin/contracts/utils/math/SafeMath.sol";
+ import "@openzeppelin/contracts/utils/math/Math.sol";

 function tryOperations(uint256 x, uint256 y) external view {
-  (bool overflowsAdd, uint256 resultAdd) = SafeMath.tryAdd(x, y);
+  (bool overflowsAdd, uint256 resultAdd) = Math.tryAdd(x, y);
-  (bool overflowsSub, uint256 resultSub) = SafeMath.trySub(x, y);
+  (bool overflowsSub, uint256 resultSub) = Math.trySub(x, y);
-  (bool overflowsMul, uint256 resultMul) = SafeMath.tryMul(x, y);
+  (bool overflowsMul, uint256 resultMul) = Math.tryMul(x, y);
-  (bool overflowsDiv, uint256 resultDiv) = SafeMath.tryDiv(x, y);
+  (bool overflowsDiv, uint256 resultDiv) = Math.tryDiv(x, y);
   // ...
 }
```

#### Adapting Governor modules

Custom Governor modules that override internal functions may require modifications if migrated to v5. In particular, the new internal functions `_queueOperations` and `_executeOperations` may need to be used. If assistance with this migration is needed reach out via the [OpenZeppelin Support Forum](https://forum.openzeppelin.com/c/support/contracts/18).

#### ECDSA and MessageHashUtils

The `ECDSA` library is now focused on signer recovery. Previously it also included utility methods for producing digests to be used with signing or recovery. These utilities have been moved to the `MessageHashUtils` library and should be imported if needed:

```diff
 import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
+import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

 contract Verifier {
   using ECDSA for bytes32;
+  using MessageHashUtils for bytes32;

   function _verify(bytes32 data, bytes memory signature, address account) internal pure returns (bool) {
     return data
       .toEthSignedMessageHash()
       .recover(signature) == account;
   }
 }
```

#### Interfaces and libraries in upgradeable contracts

The upgradeable version of the contracts library used to include a variant suffixed with `Upgradeable` for every contract. These variants, which are produced automatically, mainly include changes for dealing with storage that don't apply to libraries and interfaces.

The upgradeable library no longer includes upgradeable variants for libraries and interfaces. Projects migrating to 5.0 should replace their library and interface imports with their corresponding non-upgradeable version:

```diff
 // Libraries
-import {AddressUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol';
+import {Address} from '@openzeppelin/contracts/utils/Address.sol';

 // Interfaces
-import {IERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/interfaces/IERC20.sol';
+import {IERC20} from '@openzeppelin/contracts/interfaces/IERC20.sol';
```

#### Offchain Considerations

Some changes may affect offchain systems if they rely on assumptions that are changed along with these new breaking changes. These cases are:

##### Relying on revert strings for processing errors

A concrete example is AccessControl, where it was previously advised to catch revert reasons using the following regex:

```
/^AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})$/
```

Instead, contracts now revert with custom errors. Systems that interact with smart contracts outside of the network should consider reliance on revert strings and possibly support the new custom errors.

##### Relying on storage locations for retrieving data

After 5.0, the storage location of some variables was changed. This is the case for `Initializable` and all the upgradeable contracts since they now use namespaced storage locations. Any system relying on storage locations for retrieving data or detecting capabilities should be updated to support these new locations.

## 4.9.6 (2024-02-29)

- `Base64`: Fix issue where dirty memory located just after the input buffer is affecting the result. ([#4929](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4929))

## 4.9.5 (2023-12-08)

- `Multicall`: Make aware of non-canonical context (i.e. `msg.sender` is not `_msgSender()`), allowing compatibility with `ERC2771Context`. Patch duplicated `Address.functionDelegateCall` in v4.9.4 (removed).

## 4.9.3 (2023-07-28)

- `ERC2771Context`: Return the forwarder address whenever the `msg.data` of a call originating from a trusted forwarder is not long enough to contain the request signer address (i.e. `msg.data.length` is less than 20 bytes), as specified by ERC-2771. ([#4481](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4481))
- `ERC2771Context`: Prevent revert in `_msgData()` when a call originating from a trusted forwarder is not long enough to contain the request signer address (i.e. `msg.data.length` is less than 20 bytes). Return the full calldata in that case. ([#4484](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4484))

## 4.9.2 (2023-06-16)

- `MerkleProof`: Fix a bug in `processMultiProof` and `processMultiProofCalldata` that allows proving arbitrary leaves if the tree contains a node with value 0 at depth 1.

## 4.9.1 (2023-06-07)

- `Governor`: Add a mechanism to restrict the address of the proposer using a suffix in the description.

## 4.9.0 (2023-05-23)

- `ReentrancyGuard`: Add a `_reentrancyGuardEntered` function to expose the guard status. ([#3714](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3714))
- `ERC721Wrapper`: add a new extension of the `ERC721` token which wraps an underlying token. Deposit and withdraw guarantee that the ownership of each token is backed by a corresponding underlying token with the same identifier. ([#3863](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3863))
- `EnumerableMap`: add a `keys()` function that returns an array containing all the keys. ([#3920](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3920))
- `Governor`: add a public `cancel(uint256)` function. ([#3983](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3983))
- `Governor`: Enable timestamp operation for blockchains without a stable block time. This is achieved by connecting a Governor's internal clock to match a voting token's EIP-6372 interface. ([#3934](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3934))
- `Strings`: add `equal` method. ([#3774](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3774))
- `IERC5313`: Add an interface for EIP-5313 that is now final. ([#4013](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4013))
- `IERC4906`: Add an interface for ERC-4906 that is now Final. ([#4012](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4012))
- `StorageSlot`: Add support for `string` and `bytes`. ([#4008](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4008))
- `Votes`, `ERC20Votes`, `ERC721Votes`: support timestamp checkpointing using EIP-6372. ([#3934](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3934))
- `ERC4626`: Add mitigation to the inflation attack through virtual shares and assets. ([#3979](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3979))
- `Strings`: add `toString` method for signed integers. ([#3773](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3773))
- `ERC20Wrapper`: Make the `underlying` variable private and add a public accessor. ([#4029](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4029))
- `EIP712`: add EIP-5267 support for better domain discovery. ([#3969](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3969))
- `AccessControlDefaultAdminRules`: Add an extension of `AccessControl` with additional security rules for the `DEFAULT_ADMIN_ROLE`. ([#4009](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4009))
- `SignatureChecker`: Add `isValidERC1271SignatureNow` for checking a signature directly against a smart contract using ERC-1271. ([#3932](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3932))
- `SafeERC20`: Add a `forceApprove` function to improve compatibility with tokens behaving like USDT. ([#4067](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4067))
- `ERC1967Upgrade`: removed contract-wide `oz-upgrades-unsafe-allow delegatecall` annotation, replaced by granular annotation in `UUPSUpgradeable`. ([#3971](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3971))
- `ERC20Wrapper`: self wrapping and deposit by the wrapper itself are now explicitly forbidden. ([#4100](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4100))
- `ECDSA`: optimize bytes32 computation by using assembly instead of `abi.encodePacked`. ([#3853](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3853))
- `ERC721URIStorage`: Emit ERC-4906 `MetadataUpdate` in `_setTokenURI`. ([#4012](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4012))
- `ShortStrings`: Added a library for handling short strings in a gas efficient way, with fallback to storage for longer strings. ([#4023](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4023))
- `SignatureChecker`: Allow return data length greater than 32 from EIP-1271 signers. ([#4038](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4038))
- `UUPSUpgradeable`: added granular `oz-upgrades-unsafe-allow-reachable` annotation to improve upgrade safety checks on latest version of the Upgrades Plugins (starting with `@openzeppelin/upgrades-core@1.21.0`). ([#3971](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3971))
- `Initializable`: optimize `_disableInitializers` by using `!=` instead of `<`. ([#3787](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3787))
- `Ownable2Step`: make `acceptOwnership` public virtual to enable usecases that require overriding it. ([#3960](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3960))
- `UUPSUpgradeable.sol`: Change visibility to the functions `upgradeTo ` and `upgradeToAndCall ` from `external` to `public`. ([#3959](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3959))
- `TimelockController`: Add the `CallSalt` event to emit on operation schedule. ([#4001](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4001))
- Reformatted codebase with latest version of Prettier Solidity. ([#3898](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3898))
- `Math`: optimize `log256` rounding check. ([#3745](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3745))
- `ERC20Votes`: optimize by using unchecked arithmetic. ([#3748](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3748))
- `Multicall`: annotate `multicall` function as upgrade safe to not raise a flag for its delegatecall. ([#3961](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3961))
- `ERC20Pausable`, `ERC721Pausable`, `ERC1155Pausable`: Add note regarding missing public pausing functionality ([#4007](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4007))
- `ECDSA`: Add a function `toDataWithIntendedValidatorHash` that encodes data with version 0x00 following EIP-191. ([#4063](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4063))
- `MerkleProof`: optimize by using unchecked arithmetic. ([#3745](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3745))

### Breaking changes

- `EIP712`: Addition of ERC5267 support requires support for user defined value types, which was released in Solidity version 0.8.8. This requires a pragma change from `^0.8.0` to `^0.8.8`.
- `EIP712`: Optimization of the cache for the upgradeable version affects the way `name` and `version` are set. This is no longer done through an initializer, and is instead part of the implementation's constructor. As a consequence, all proxies using the same implementation will necessarily share the same `name` and `version`. Additionally, an implementation upgrade risks changing the EIP712 domain unless the same `name` and `version` are used when deploying the new implementation contract.

### Deprecations

- `ERC20Permit`: Added the file `IERC20Permit.sol` and `ERC20Permit.sol` and deprecated `draft-IERC20Permit.sol` and `draft-ERC20Permit.sol` since [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) is no longer a Draft. Developers are encouraged to update their imports. ([#3793](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3793))
- `Timers`: The `Timers` library is now deprecated and will be removed in the next major release. ([#4062](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4062))
- `ERC777`: The `ERC777` token standard is no longer supported by OpenZeppelin. Our implementation is now deprecated and will be removed in the next major release. The corresponding standard interfaces remain available. ([#4066](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4066))
- `ERC1820Implementer`: The `ERC1820` pseudo-introspection mechanism is no longer supported by OpenZeppelin. Our implementation is now deprecated and will be removed in the next major release. The corresponding standard interfaces remain available. ([#4066](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4066))

## 4.8.3 (2023-04-13)

- `GovernorCompatibilityBravo`: Fix encoding of proposal data when signatures are missing.
- `TransparentUpgradeableProxy`: Fix transparency in case of selector clash with non-decodable calldata or payable mutability. ([#4154](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/4154))

## 4.8.2 (2023-03-02)

- `ERC721Consecutive`: Fixed a bug when `_mintConsecutive` is used for batches of size 1 that could lead to balance overflow. Refer to the breaking changes section in the changelog for a note on the behavior of `ERC721._beforeTokenTransfer`.

### Breaking changes

- `ERC721`: The internal function `_beforeTokenTransfer` no longer updates balances, which it previously did when `batchSize` was greater than 1. This change has no consequence unless a custom ERC721 extension is explicitly invoking `_beforeTokenTransfer`. Balance updates in extensions must now be done explicitly using `__unsafe_increaseBalance`, with a name that indicates that there is an invariant that has to be manually verified.

## 4.8.1 (2023-01-12)

- `ERC4626`: Use staticcall instead of call when fetching underlying ERC-20 decimals. ([#3943](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3943))

## 4.8.0 (2022-11-08)

- `TimelockController`: Added a new `admin` constructor parameter that is assigned the admin role instead of the deployer account. ([#3722](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3722))
- `Initializable`: add internal functions `_getInitializedVersion` and `_isInitializing` ([#3598](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3598))
- `ERC165Checker`: add `supportsERC165InterfaceUnchecked` for consulting individual interfaces without the full ERC165 protocol. ([#3339](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3339))
- `Address`: optimize `functionCall` by calling `functionCallWithValue` directly. ([#3468](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3468))
- `Address`: optimize `functionCall` functions by checking contract size only if there is no returned data. ([#3469](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3469))
- `Governor`: make the `relay` function payable, and add support for EOA payments. ([#3730](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3730))
- `GovernorCompatibilityBravo`: remove unused `using` statements. ([#3506](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3506))
- `ERC20`: optimize `_transfer`, `_mint` and `_burn` by using `unchecked` arithmetic when possible. ([#3513](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3513))
- `ERC20Votes`, `ERC721Votes`: optimize `getPastVotes` for looking up recent checkpoints. ([#3673](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3673))
- `ERC20FlashMint`: add an internal `_flashFee` function for overriding. ([#3551](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3551))
- `ERC4626`: use the same `decimals()` as the underlying asset by default (if available). ([#3639](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3639))
- `ERC4626`: add internal `_initialConvertToShares` and `_initialConvertToAssets` functions to customize empty vaults behavior. ([#3639](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3639))
- `ERC721`: optimize transfers by making approval clearing implicit instead of emitting an event. ([#3481](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3481))
- `ERC721`: optimize burn by making approval clearing implicit instead of emitting an event. ([#3538](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3538))
- `ERC721`: Fix balance accounting when a custom `_beforeTokenTransfer` hook results in a transfer of the token under consideration. ([#3611](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3611))
- `ERC721`: use unchecked arithmetic for balance updates. ([#3524](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3524))
- `ERC721Consecutive`: Implementation of EIP-2309 that allows batch minting of ERC721 tokens during construction. ([#3311](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3311))
- `ReentrancyGuard`: Reduce code size impact of the modifier by using internal functions. ([#3515](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3515))
- `SafeCast`: optimize downcasting of signed integers. ([#3565](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3565))
- `ECDSA`: Remove redundant check on the `v` value. ([#3591](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3591))
- `VestingWallet`: add `releasable` getters. ([#3580](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3580))
- `VestingWallet`: remove unused library `Math.sol`. ([#3605](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3605))
- `VestingWallet`: make constructor payable. ([#3665](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3665))
- `Create2`: optimize address computation by using assembly instead of `abi.encodePacked`. ([#3600](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3600))
- `Clones`: optimized the assembly to use only the scratch space during deployments, and optimized `predictDeterministicAddress` to use fewer operations. ([#3640](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3640))
- `Checkpoints`: Use procedural generation to support multiple key/value lengths. ([#3589](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3589))
- `Checkpoints`: Add new lookup mechanisms. ([#3589](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3589))
- `Arrays`: Add `unsafeAccess` functions that allow reading and writing to an element in a storage array bypassing Solidity's "out-of-bounds" check. ([#3589](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3589))
- `Strings`: optimize `toString`. ([#3573](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3573))
- `Ownable2Step`: extension of `Ownable` that makes the ownership transfers a two step process. ([#3620](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3620))
- `Math` and `SignedMath`: optimize function `max` by using `>` instead of `>=`. ([#3679](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3679))
- `Math`: Add `log2`, `log10` and `log256`. ([#3670](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3670))
- Arbitrum: Update the vendored arbitrum contracts to match the nitro upgrade. ([#3692](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3692))

### Breaking changes

- `ERC721`: In order to add support for batch minting via `ERC721Consecutive` it was necessary to make a minor breaking change in the internal interface of `ERC721`. Namely, the hooks `_beforeTokenTransfer` and `_afterTokenTransfer` have one additional argument that may need to be added to overrides:

```diff
 function _beforeTokenTransfer(
     address from,
     address to,
     uint256 tokenId,
+    uint256 batchSize
 ) internal virtual override
```

- `ERC4626`: Conversion from shares to assets (and vice-versa) in an empty vault used to consider the possible mismatch between the underlying asset's and the vault's decimals. This initial conversion rate is now set to 1-to-1 irrespective of decimals, which are meant for usability purposes only. The vault now uses the assets decimals by default, so off-chain the numbers should appear the same. Developers overriding the vault decimals to a value that does not match the underlying asset may want to override the `_initialConvertToShares` and `_initialConvertToAssets` to replicate the previous behavior.

- `TimelockController`: During deployment, the TimelockController used to grant the `TIMELOCK_ADMIN_ROLE` to the deployer and to the timelock itself. The deployer was then expected to renounce this role once configuration of the timelock is over. Failing to renounce that role allows the deployer to change the timelock permissions (but not to bypass the delay for any time-locked actions). The role is no longer given to the deployer by default. A new parameter `admin` can be set to a non-zero address to grant the admin role during construction (to the deployer or any other address). Just like previously, this admin role should be renounced after configuration. If this param is given `address(0)`, the role is not allocated and doesn't need to be revoked. In any case, the timelock itself continues to have this role.

### Deprecations

- `EIP712`: Added the file `EIP712.sol` and deprecated `draft-EIP712.sol` since the EIP is no longer a Draft. Developers are encouraged to update their imports. ([#3621](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3621))

```diff
-import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
+import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
```

- `ERC721Votes`: Added the file `ERC721Votes.sol` and deprecated `draft-ERC721Votes.sol` since it no longer depends on a Draft EIP (EIP-712). Developers are encouraged to update their imports. ([#3699](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3699))

```diff
-import "@openzeppelin/contracts/token/ERC721/extensions/draft-ERC721Votes.sol";
+import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Votes.sol";
```

### ERC-721 Compatibility Note

ERC-721 integrators that interpret contract state from events should make sure that they implement the clearing of approval that is implicit in every transfer according to the EIP. Previous versions of OpenZeppelin Contracts emitted an explicit `Approval` event even though it was not required by the specification, and this is no longer the case.

With the new `ERC721Consecutive` extension, the internal workings of `ERC721` are slightly changed. Custom extensions to ERC721 should be reviewed to ensure they remain correct. The internal functions that should be considered are `_ownerOf` (new), `_beforeTokenTransfer`, and `_afterTokenTransfer`.

### ERC-4626 Upgrade Note

Existing `ERC4626` contracts that are upgraded to 4.8 must initialize a new variable that holds the vault token decimals. The recommended way to do this is to use a [reinitializer]:

[reinitializer]: https://docs.openzeppelin.com/contracts/4.x/api/proxy#Initializable-reinitializer-uint8-

```solidity
function migrateToV48() public reinitializer(2) {
  __ERC4626_init(IERC20Upgradeable(asset()));
}
```

## 4.7.3 (2022-08-10)

### Breaking changes

- `ECDSA`: `recover(bytes32,bytes)` and `tryRecover(bytes32,bytes)` no longer accept compact signatures to prevent malleability. Compact signature support remains available using `recover(bytes32,bytes32,bytes32)` and `tryRecover(bytes32,bytes32,bytes32)`.

## 4.7.2 (2022-07-25)

- `LibArbitrumL2`, `CrossChainEnabledArbitrumL2`: Fixed detection of cross-chain calls for EOAs. Previously, calls from EOAs would be classified as cross-chain calls. ([#3578](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3578))
- `GovernorVotesQuorumFraction`: Fixed quorum updates so they do not affect past proposals that failed due to lack of quorum. ([#3561](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3561))
- `ERC165Checker`: Added protection against large returndata. ([#3587](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3587))

## 4.7.1 (2022-07-18)

- `SignatureChecker`: Fix an issue that causes `isValidSignatureNow` to revert when the target contract returns ill-encoded data. ([#3552](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3552))
- `ERC165Checker`: Fix an issue that causes `supportsInterface` to revert when the target contract returns ill-encoded data. ([#3552](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3552))

## 4.7.0 (2022-06-29)

- `TimelockController`: Migrate `_call` to `_execute` and allow inheritance and overriding similar to `Governor`. ([#3317](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3317))
- `CrossChainEnabledPolygonChild`: replace the `require` statement with the custom error `NotCrossChainCall`. ([#3380](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3380))
- `ERC20FlashMint`: Add customizable flash fee receiver. ([#3327](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3327))
- `ERC4626`: add an extension of `ERC20` that implements the ERC4626 Tokenized Vault Standard. ([#3171](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3171))
- `SafeERC20`: add `safePermit` as mitigation against phantom permit functions. ([#3280](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3280))
- `Math`: add a `mulDiv` function that can round the result either up or down. ([#3171](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3171))
- `Math`: Add a `sqrt` function to compute square roots of integers, rounding either up or down. ([#3242](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3242))
- `Strings`: add a new overloaded function `toHexString` that converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal representation. ([#3403](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3403))
- `EnumerableMap`: add new `UintToUintMap` map type. ([#3338](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3338))
- `EnumerableMap`: add new `Bytes32ToUintMap` map type. ([#3416](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3416))
- `SafeCast`: add support for many more types, using procedural code generation. ([#3245](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3245))
- `MerkleProof`: add `multiProofVerify` to prove multiple values are part of a Merkle tree. ([#3276](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3276))
- `MerkleProof`: add calldata versions of the functions to avoid copying input arrays to memory and save gas. ([#3200](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3200))
- `ERC721`, `ERC1155`: simplified revert reasons. ([#3254](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3254), ([#3438](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3438)))
- `ERC721`: removed redundant require statement. ([#3434](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3434))
- `PaymentSplitter`: add `releasable` getters. ([#3350](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3350))
- `Initializable`: refactored implementation of modifiers for easier understanding. ([#3450](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3450))
- `Proxies`: remove runtime check of ERC1967 storage slots. ([#3455](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3455))

### Breaking changes

- `Initializable`: functions decorated with the modifier `reinitializer(1)` may no longer invoke each other.

## 4.6.0 (2022-04-26)

- `crosschain`: Add a new set of contracts for cross-chain applications. `CrossChainEnabled` is a base contract with instantiations for several chains and bridges, and `AccessControlCrossChain` is an extension of access control that allows cross-chain operation. ([#3183](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3183))
- `AccessControl`: add a virtual `_checkRole(bytes32)` function that can be overridden to alter the `onlyRole` modifier behavior. ([#3137](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3137))
- `EnumerableMap`: add new `AddressToUintMap` map type. ([#3150](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3150))
- `EnumerableMap`: add new `Bytes32ToBytes32Map` map type. ([#3192](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3192))
- `ERC20FlashMint`: support infinite allowance when paying back a flash loan. ([#3226](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3226))
- `ERC20Wrapper`: the `decimals()` function now tries to fetch the value from the underlying token instance. If that calls revert, then the default value is used. ([#3259](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3259))
- `draft-ERC20Permit`: replace `immutable` with `constant` for `_PERMIT_TYPEHASH` since the `keccak256` of string literals is treated specially and the hash is evaluated at compile time. ([#3196](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3196))
- `ERC1155`: Add a `_afterTokenTransfer` hook for improved extensibility. ([#3166](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3166))
- `ERC1155URIStorage`: add a new extension that implements a `_setURI` behavior similar to ERC721's `_setTokenURI`. ([#3210](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3210))
- `DoubleEndedQueue`: a new data structure that supports efficient push and pop to both front and back, useful for FIFO and LIFO queues. ([#3153](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3153))
- `Governor`: improved security of `onlyGovernance` modifier when using an external executor contract (e.g. a timelock) that can operate without necessarily going through the governance protocol. ([#3147](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3147))
- `Governor`: Add a way to parameterize votes. This can be used to implement voting systems such as fractionalized voting, ERC721 based voting, or any number of other systems. The `params` argument added to `_countVote` method, and included in the newly added `_getVotes` method, can be used by counting and voting modules respectively for such purposes. ([#3043](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3043))
- `Governor`: rewording of revert reason for consistency. ([#3275](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3275))
- `Governor`: fix an inconsistency in data locations that could lead to invalid bytecode being produced. ([#3295](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3295))
- `Governor`: Implement `IERC721Receiver` and `IERC1155Receiver` to improve token custody by governors. ([#3230](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3230))
- `TimelockController`: Implement `IERC721Receiver` and `IERC1155Receiver` to improve token custody by timelocks. ([#3230](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3230))
- `TimelockController`: Add a separate canceller role for the ability to cancel. ([#3165](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3165))
- `Initializable`: add a reinitializer modifier that enables the initialization of new modules, added to already initialized contracts through upgradeability. ([#3232](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3232))
- `Initializable`: add an Initialized event that tracks initialized version numbers. ([#3294](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3294))
- `ERC2981`: make `royaltyInfo` public to allow super call in overrides. ([#3305](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3305))

### Upgradeability notice

- `TimelockController`: **(Action needed)** The upgrade from <4.6 to >=4.6 introduces a new `CANCELLER_ROLE` that requires set up to be assignable. After the upgrade, only addresses with this role will have the ability to cancel. Proposers will no longer be able to cancel. Assigning cancellers can be done by an admin (including the timelock itself) once the role admin is set up. To do this, we recommend upgrading to the `TimelockControllerWith46MigrationUpgradeable` contract and then calling the `migrateTo46` function.

### Breaking changes

- `Governor`: Adds internal virtual `_getVotes` method that must be implemented; this is a breaking change for existing concrete extensions to `Governor`. To fix this on an existing voting module extension, rename `getVotes` to `_getVotes` and add a `bytes memory` argument. ([#3043](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3043))
- `Governor`: Adds `params` parameter to internal virtual `_countVote` method; this is a breaking change for existing concrete extensions to `Governor`. To fix this on an existing counting module extension, add a `bytes memory` argument to `_countVote`. ([#3043](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3043))
- `Governor`: Does not emit `VoteCast` event when params data is non-empty; instead emits `VoteCastWithParams` event. To fix this on an integration that consumes the `VoteCast` event, also fetch/monitor `VoteCastWithParams` events. ([#3043](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3043))
- `Votes`: The internal virtual function `_getVotingUnits` was made `view` (which was accidentally missing). Any overrides should now be updated so they are `view` as well.

## 4.5.0 (2022-02-09)

- `ERC2981`: add implementation of the royalty standard, and the respective extensions for `ERC721` and `ERC1155`. ([#3012](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3012))
- `GovernorTimelockControl`: improve the `state()` function to have it reflect cases where a proposal has been canceled directly on the timelock. ([#2977](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2977))
- Preset contracts are now deprecated in favor of [Contracts Wizard](https://wizard.openzeppelin.com). ([#2986](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2986))
- `Governor`: add a relay function to help recover assets sent to a governor that is not its own executor (e.g. when using a timelock). ([#2926](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2926))
- `GovernorPreventLateQuorum`: add new module to ensure a minimum voting duration is available after the quorum is reached. ([#2973](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2973))
- `ERC721`: improved revert reason when transferring from wrong owner. ([#2975](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2975))
- `Votes`: Added a base contract for vote tracking with delegation. ([#2944](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2944))
- `ERC721Votes`: Added an extension of ERC721 enabled with vote tracking and delegation. ([#2944](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2944))
- `ERC2771Context`: use immutable storage to store the forwarder address, no longer an issue since Solidity >=0.8.8 allows reading immutable variables in the constructor. ([#2917](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2917))
- `Base64`: add a library to parse bytes into base64 strings using `encode(bytes memory)` function, and provide examples to show how to use to build URL-safe `tokenURIs`. ([#2884](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2884))
- `ERC20`: reduce allowance before triggering transfer. ([#3056](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3056))
- `ERC20`: do not update allowance on `transferFrom` when allowance is `type(uint256).max`. ([#3085](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3085))
- `ERC20`: add a `_spendAllowance` internal function. ([#3170](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3170))
- `ERC20Burnable`: do not update allowance on `burnFrom` when allowance is `type(uint256).max`. ([#3170](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3170))
- `ERC777`: do not update allowance on `transferFrom` when allowance is `type(uint256).max`. ([#3085](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3085))
- `ERC777`: add a `_spendAllowance` internal function. ([#3170](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3170))
- `SignedMath`: a new signed version of the Math library with `max`, `min`, and `average`. ([#2686](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2686))
- `SignedMath`: add an `abs(int256)` method that returns the unsigned absolute value of a signed value. ([#2984](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2984))
- `ERC1967Upgrade`: Refactor the secure upgrade to use `ERC1822` instead of the previous rollback mechanism. This reduces code complexity and attack surface with similar security guarantees. ([#3021](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3021))
- `UUPSUpgradeable`: Add `ERC1822` compliance to support the updated secure upgrade mechanism. ([#3021](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3021))
- Some more functions have been made virtual to customize them via overrides. In many cases this will not imply that other functions in the contract will automatically adapt to the overridden definitions. People who wish to override should consult the source code to understand the impact and if they need to override any additional functions to achieve the desired behavior.

### Breaking changes

- `ERC1967Upgrade`: The function `_upgradeToAndCallSecure` was renamed to `_upgradeToAndCallUUPS`, along with the change in security mechanism described above.
- `Address`: The Solidity pragma is increased from `^0.8.0` to `^0.8.1`. This is required by the `account.code.length` syntax that replaces inline assembly. This may require users to bump their compiler version from `0.8.0` to `0.8.1` or later. Note that other parts of the code already include stricter requirements.

## 4.4.2 (2022-01-11)

### Bugfixes

- `GovernorCompatibilityBravo`: Fix error in the encoding of calldata for proposals submitted through the compatibility interface with explicit signatures. ([#3100](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3100))

## 4.4.1 (2021-12-14)

- `Initializable`: change the existing `initializer` modifier and add a new `onlyInitializing` modifier to prevent reentrancy risk. ([#3006](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/3006))

### Breaking change

It is no longer possible to call an `initializer`-protected function from within another `initializer` function outside the context of a constructor. Projects using OpenZeppelin upgradeable proxies should continue to work as is, since in the common case the initializer is invoked in the constructor directly. If this is not the case for you, the suggested change is to use the new `onlyInitializing` modifier in the following way:

```diff
 contract A {
-    function initialize() public   initializer { ... }
+    function initialize() internal onlyInitializing { ... }
 }
 contract B is A {
     function initialize() public initializer {
         A.initialize();
     }
 }
```

## 4.4.0 (2021-11-25)

- `Ownable`: add an internal `_transferOwnership(address)`. ([#2568](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2568))
- `AccessControl`: add internal `_grantRole(bytes32,address)` and `_revokeRole(bytes32,address)`. ([#2568](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2568))
- `AccessControl`: mark `_setupRole(bytes32,address)` as deprecated in favor of `_grantRole(bytes32,address)`. ([#2568](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2568))
- `AccessControlEnumerable`: hook into `_grantRole(bytes32,address)` and `_revokeRole(bytes32,address)`. ([#2946](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2946))
- `EIP712`: cache `address(this)` to immutable storage to avoid potential issues if a vanilla contract is used in a delegatecall context. ([#2852](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2852))
- Add internal `_setApprovalForAll` to `ERC721` and `ERC1155`. ([#2834](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2834))
- `Governor`: shift vote start and end by one block to better match Compound's GovernorBravo and prevent voting at the Governor level if the voting snapshot is not ready. ([#2892](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2892))
- `GovernorCompatibilityBravo`: consider quorum an inclusive rather than exclusive minimum to match Compound's GovernorBravo. ([#2974](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2974))
- `GovernorSettings`: a new governor module that manages voting settings updatable through governance actions. ([#2904](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2904))
- `PaymentSplitter`: now supports ERC20 assets in addition to Ether. ([#2858](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2858))
- `ECDSA`: add a variant of `toEthSignedMessageHash` for arbitrary length message hashing. ([#2865](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2865))
- `MerkleProof`: add a `processProof` function that returns the rebuilt root hash given a leaf and a proof. ([#2841](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2841))
- `VestingWallet`: new contract that handles the vesting of Ether and ERC20 tokens following a customizable vesting schedule. ([#2748](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2748))
- `Governor`: enable receiving Ether when a Timelock contract is not used. ([#2849](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2849))
- `GovernorTimelockCompound`: fix ability to use Ether stored in the Timelock contract. ([#2849](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2849))

## 4.3.3 (2021-11-08)

- `ERC1155Supply`: Handle `totalSupply` changes by hooking into `_beforeTokenTransfer` to ensure consistency of balances and supply during `IERC1155Receiver.onERC1155Received` calls.

## 4.3.2 (2021-09-14)

- `UUPSUpgradeable`: Add modifiers to prevent `upgradeTo` and `upgradeToAndCall` being executed on any contract that is not the active ERC1967 proxy. This prevents these functions being called on implementation contracts or minimal ERC1167 clones, in particular.

## 4.3.1 (2021-08-26)

- `TimelockController`: Add additional isOperationReady check.

## 4.3.0 (2021-08-17)

- `ERC2771Context`: use private variable from storage to store the forwarder address. Fixes issues where `_msgSender()` was not callable from constructors. ([#2754](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2754))
- `EnumerableSet`: add `values()` functions that returns an array containing all values in a single call. ([#2768](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2768))
- `Governor`: added a modular system of `Governor` contracts based on `GovernorAlpha` and `GovernorBravo`. ([#2672](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2672))
- Add an `interfaces` folder containing solidity interfaces to final ERCs. ([#2517](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2517))
- `ECDSA`: add `tryRecover` functions that will not throw if the signature is invalid, and will return an error flag instead. ([#2661](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2661))
- `SignatureChecker`: Reduce gas usage of the `isValidSignatureNow` function for the "signature by EOA" case. ([#2661](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2661))

## 4.2.0 (2021-06-30)

- `ERC20Votes`: add a new extension of the `ERC20` token with support for voting snapshots and delegation. ([#2632](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2632))
- `ERC20VotesComp`: Variant of `ERC20Votes` that is compatible with Compound's `Comp` token interface but restricts supply to `uint96`. ([#2706](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2706))
- `ERC20Wrapper`: add a new extension of the `ERC20` token which wraps an underlying token. Deposit and withdraw guarantee that the total supply is backed by a corresponding amount of underlying token. ([#2633](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2633))
- Enumerables: Improve gas cost of removal in `EnumerableSet` and `EnumerableMap`.
- Enumerables: Improve gas cost of lookup in `EnumerableSet` and `EnumerableMap`.
- `Counter`: add a reset method. ([#2678](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2678))
- Tokens: Wrap definitely safe subtractions in `unchecked` blocks.
- `Math`: Add a `ceilDiv` method for performing ceiling division.
- `ERC1155Supply`: add a new `ERC1155` extension that keeps track of the totalSupply of each tokenId. ([#2593](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2593))
- `BitMaps`: add a new `BitMaps` library that provides a storage efficient datastructure for `uint256` to `bool` mapping with contiguous keys. ([#2710](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2710))

### Breaking Changes

- `ERC20FlashMint` is no longer a Draft ERC. ([#2673](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2673)))

**How to update:** Change your import paths by removing the `draft-` prefix from `@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20FlashMint.sol`.

> See [Releases and Stability: Drafts](https://docs.openzeppelin.com/contracts/4.x/releases-stability#drafts).

## 4.1.0 (2021-04-29)

- `IERC20Metadata`: add a new extended interface that includes the optional `name()`, `symbol()` and `decimals()` functions. ([#2561](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2561))
- `ERC777`: make reception acquirement optional in `_mint`. ([#2552](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2552))
- `ERC20Permit`: add a `_useNonce` to enable further usage of ERC712 signatures. ([#2565](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2565))
- `ERC20FlashMint`: add an implementation of the ERC3156 extension for flash-minting ERC20 tokens. ([#2543](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2543))
- `SignatureChecker`: add a signature verification library that supports both EOA and ERC1271 compliant contracts as signers. ([#2532](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2532))
- `Multicall`: add abstract contract with `multicall(bytes[] calldata data)` function to bundle multiple calls together ([#2608](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2608))
- `ECDSA`: add support for ERC2098 short-signatures. ([#2582](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2582))
- `AccessControl`: add an `onlyRole` modifier to restrict specific function to callers bearing a specific role. ([#2609](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2609))
- `StorageSlot`: add a library for reading and writing primitive types to specific storage slots. ([#2542](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2542))
- UUPS Proxies: add `UUPSUpgradeable` to implement the UUPS proxy pattern together with `EIP1967Proxy`. ([#2542](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2542))

### Breaking changes

This release includes two small breaking changes in `TimelockController`.

1. The `onlyRole` modifier in this contract was designed to let anyone through if the role was granted to `address(0)`,
   allowing the possibility to make a role "open", which can be used for `EXECUTOR_ROLE`. This modifier is now
   replaced by `AccessControl.onlyRole`, which does not have this ability. The previous behavior was moved to the
   modifier `TimelockController.onlyRoleOrOpenRole`.
2. It was possible to make `PROPOSER_ROLE` an open role (as described in the previous item) if it was granted to
   `address(0)`. This would affect the `schedule`, `scheduleBatch`, and `cancel` operations in `TimelockController`.
   This ability was removed as it does not make sense to open up the `PROPOSER_ROLE` in the same way that it does for
   `EXECUTOR_ROLE`.

## 4.0.0 (2021-03-23)

- Now targeting the 0.8.x line of Solidity compilers. For 0.6.x (resp 0.7.x) support, use version 3.4.0 (resp 3.4.0-solc-0.7) of OpenZeppelin.
- `Context`: making `_msgData` return `bytes calldata` instead of `bytes memory` ([#2492](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2492))
- `ERC20`: removed the `_setDecimals` function and the storage slot associated to decimals. ([#2502](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2502))
- `Strings`: addition of a `toHexString` function. ([#2504](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2504))
- `EnumerableMap`: change implementation to optimize for `key → value` lookups instead of enumeration. ([#2518](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2518))
- `GSN`: deprecate GSNv1 support in favor of upcoming support for GSNv2. ([#2521](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2521))
- `ERC165`: remove uses of storage in the base ERC165 implementation. ERC165 based contracts now use storage-less virtual functions. Old behavior remains available in the `ERC165Storage` extension. ([#2505](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2505))
- `Initializable`: make initializer check stricter during construction. ([#2531](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2531))
- `ERC721`: remove enumerability of tokens from the base implementation. This feature is now provided separately through the `ERC721Enumerable` extension. ([#2511](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2511))
- `AccessControl`: removed enumerability by default for a more lightweight contract. It is now opt-in through `AccessControlEnumerable`. ([#2512](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2512))
- Meta Transactions: add `ERC2771Context` and a `MinimalForwarder` for meta-transactions. ([#2508](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2508))
- Overall reorganization of the contract folder to improve clarity and discoverability. ([#2503](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2503))
- `ERC20Capped`: optimize gas usage by enforcing the check directly in `_mint`. ([#2524](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2524))
- Rename `UpgradeableProxy` to `ERC1967Proxy`. ([#2547](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2547))
- `ERC777`: optimize the gas costs of the constructor. ([#2551](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2551))
- `ERC721URIStorage`: add a new extension that implements the `_setTokenURI` behavior as it was available in 3.4.0. ([#2555](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2555))
- `AccessControl`: added ERC165 interface detection. ([#2562](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2562))
- `ERC1155`: make `uri` public so overloading function can call it using super. ([#2576](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2576))

### Bug fixes for beta releases

- `AccessControlEnumerable`: Fixed `renounceRole` not updating enumerable set of addresses for a role. ([#2572](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2572))

### How to upgrade from 3.x

Since this version has moved a few contracts to different directories, users upgrading from a previous version will need to adjust their import statements. To make this easier, the package includes a script that will migrate import statements automatically. After upgrading to the latest version of the package, run:

```
npx openzeppelin-contracts-migrate-imports
```

Make sure you're using git or another version control system to be able to recover from any potential error in our script.

### How to upgrade from 4.0-beta.x

Some further changes have been done between the different beta iterations. Transitions made during this period are configured in the `migrate-imports` script. Consequently, you can upgrade from any previous 4.0-beta.x version using the same script as described in the _How to upgrade from 3.x_ section.

## 3.4.2 (2021-07-24)

- `TimelockController`: Add additional isOperationReady check.

## 3.4.1 (2021-03-03)

- `ERC721`: made `_approve` an internal function (was private).

## 3.4.0 (2021-02-02)

- `BeaconProxy`: added new kind of proxy that allows simultaneous atomic upgrades. ([#2411](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2411))
- `EIP712`: added helpers to verify EIP712 typed data signatures on chain. ([#2418](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2418))
- `ERC20Permit`: added an implementation of the ERC20 permit extension for gasless token approvals. ([#2237](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2237))
- Presets: added token presets with preminted fixed supply `ERC20PresetFixedSupply` and `ERC777PresetFixedSupply`. ([#2399](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2399))
- `Address`: added `functionDelegateCall`, similar to the existing `functionCall`. ([#2333](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2333))
- `Clones`: added a library for deploying EIP 1167 minimal proxies. ([#2449](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2449))
- `Context`: moved from `contracts/GSN` to `contracts/utils`. ([#2453](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2453))
- `PaymentSplitter`: replace usage of `.transfer()` with `Address.sendValue` for improved compatibility with smart wallets. ([#2455](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2455))
- `UpgradeableProxy`: bubble revert reasons from initialization calls. ([#2454](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2454))
- `SafeMath`: fix a memory allocation issue by adding new `SafeMath.tryOp(uint,uint)→(bool,uint)` functions. `SafeMath.op(uint,uint,string)→uint` are now deprecated. ([#2462](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2462))
- `EnumerableMap`: fix a memory allocation issue by adding new `EnumerableMap.tryGet(uint)→(bool,address)` functions. `EnumerableMap.get(uint)→string` is now deprecated. ([#2462](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2462))
- `ERC165Checker`: added batch `getSupportedInterfaces`. ([#2469](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2469))
- `RefundEscrow`: `beneficiaryWithdraw` will forward all available gas to the beneficiary. ([#2480](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2480))
- Many view and pure functions have been made virtual to customize them via overrides. In many cases this will not imply that other functions in the contract will automatically adapt to the overridden definitions. People who wish to override should consult the source code to understand the impact and if they need to override any additional functions to achieve the desired behavior.

### Security Fixes

- `ERC777`: fix potential reentrancy issues for custom extensions to `ERC777`. ([#2483](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2483))

If you're using our implementation of ERC777 from version 3.3.0 or earlier, and you define a custom `_beforeTokenTransfer` function that writes to a storage variable, you may be vulnerable to a reentrancy attack. If you're affected and would like assistance please write to security@openzeppelin.com. [Read more in the pull request.](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2483)

## 3.3.0 (2020-11-26)

- Now supports both Solidity 0.6 and 0.7. Compiling with solc 0.7 will result in warnings. Install the `solc-0.7` tag to compile without warnings.
- `Address`: added `functionStaticCall`, similar to the existing `functionCall`. ([#2333](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2333))
- `TimelockController`: added a contract to augment access control schemes with a delay. ([#2354](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2354))
- `EnumerableSet`: added `Bytes32Set`, for sets of `bytes32`. ([#2395](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2395))

## 3.2.2-solc-0.7 (2020-10-28)

- Resolve warnings introduced by Solidity 0.7.4. ([#2396](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2396))

## 3.2.1-solc-0.7 (2020-09-15)

- `ERC777`: Remove a warning about function state visibility in Solidity 0.7. ([#2327](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2327))

## 3.2.0 (2020-09-10)

### New features

- Proxies: added the proxy contracts from OpenZeppelin SDK. ([#2335](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2335))

#### Proxy changes with respect to OpenZeppelin SDK

Aside from upgrading them from Solidity 0.5 to 0.6, we've changed a few minor things from the proxy contracts as they were found in OpenZeppelin SDK.

- `UpgradeabilityProxy` was renamed to `UpgradeableProxy`.
- `AdminUpgradeabilityProxy` was renamed to `TransparentUpgradeableProxy`.
- `Proxy._willFallback` was renamed to `Proxy._beforeFallback`.
- `UpgradeabilityProxy._setImplementation` and `AdminUpgradeabilityProxy._setAdmin` were made private.

### Improvements

- `Address.isContract`: switched from `extcodehash` to `extcodesize` for less gas usage. ([#2311](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2311))

### Breaking changes

- `ERC20Snapshot`: switched to using `_beforeTokenTransfer` hook instead of overriding ERC20 operations. ([#2312](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2312))

This small change in the way we implemented `ERC20Snapshot` may affect users who are combining this contract with
other ERC20 flavors, since it no longer overrides `_transfer`, `_mint`, and `_burn`. This can result in having to remove Solidity `override(...)` specifiers in derived contracts for these functions, and to instead have to add it for `_beforeTokenTransfer`. See [Using Hooks](https://docs.openzeppelin.com/contracts/3.x/extending-contracts#using-hooks) in the documentation.

## 3.1.0 (2020-06-23)

### New features

- `SafeCast`: added functions to downcast signed integers (e.g. `toInt32`), improving usability of `SignedSafeMath`. ([#2243](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2243))
- `functionCall`: new helpers that replicate Solidity's function call semantics, reducing the need to rely on `call`. ([#2264](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2264))
- `ERC1155`: added support for a base implementation, non-standard extensions and a preset contract. ([#2014](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2014), [#2230](https://github.com/OpenZeppelin/openzeppelin-contracts/issues/2230))

### Improvements

- `ReentrancyGuard`: reduced overhead of using the `nonReentrant` modifier. ([#2171](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2171))
- `AccessControl`: added a `RoleAdminChanged` event to `_setAdminRole`. ([#2214](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2214))
- Made all `public` functions in the token preset contracts `virtual`. ([#2257](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2257))

### Deprecations

- `SafeERC20`: deprecated `safeApprove`. ([#2268](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2268))

## 3.0.2 (2020-06-08)

### Improvements

- Added SPX license identifier to all contracts. ([#2235](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2235))

## 3.0.1 (2020-04-27)

### Bugfixes

- `ERC777`: fixed the `_approve` internal function not validating some of their arguments for non-zero addresses. ([#2213](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2213))

## 3.0.0 (2020-04-20)

### New features

- `AccessControl`: new contract for managing permissions in a system, replacement for `Ownable` and `Roles`. ([#2112](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2112))
- `SafeCast`: new functions to convert to and from signed and unsigned values: `toUint256` and `toInt256`. ([#2123](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2123))
- `EnumerableMap`: a new data structure for key-value pairs (like `mapping`) that can be iterated over. ([#2160](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2160))

### Breaking changes

- `ERC721`: `burn(owner, tokenId)` was removed, use `burn(tokenId)` instead. ([#2125](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2125))
- `ERC721`: `_checkOnERC721Received` was removed. ([#2125](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2125))
- `ERC721`: `_transferFrom` and `_safeTransferFrom` were renamed to `_transfer` and `_safeTransfer`. ([#2162](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2162))
- `Ownable`: removed `_transferOwnership`. ([#2162](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2162))
- `PullPayment`, `Escrow`: `withdrawWithGas` was removed. The old `withdraw` function now forwards all gas. ([#2125](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2125))
- `Roles` was removed, use `AccessControl` as a replacement. ([#2112](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2112))
- `ECDSA`: when receiving an invalid signature, `recover` now reverts instead of returning the zero address. ([#2114](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2114))
- `Create2`: added an `amount` argument to `deploy` for contracts with `payable` constructors. ([#2117](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2117))
- `Pausable`: moved to the `utils` directory. ([#2122](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2122))
- `Strings`: moved to the `utils` directory. ([#2122](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2122))
- `Counters`: moved to the `utils` directory. ([#2122](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2122))
- `SignedSafeMath`: moved to the `math` directory. ([#2122](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2122))
- `ERC20Snapshot`: moved to the `token/ERC20` directory. `snapshot` was changed into an `internal` function. ([#2122](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2122))
- `Ownable`: moved to the `access` directory. ([#2120](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2120))
- `Ownable`: removed `isOwner`. ([#2120](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2120))
- `Secondary`: removed from the library, use `Ownable` instead. ([#2120](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2120))
- `Escrow`, `ConditionalEscrow`, `RefundEscrow`: these now use `Ownable` instead of `Secondary`, their external API changed accordingly. ([#2120](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2120))
- `ERC20`: removed `_burnFrom`. ([#2119](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2119))
- `Address`: removed `toPayable`, use `payable(address)` instead. ([#2133](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2133))
- `ERC777`: `_send`, `_mint` and `_burn` now use the caller as the operator. ([#2134](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2134))
- `ERC777`: removed `_callsTokensToSend` and `_callTokensReceived`. ([#2134](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2134))
- `EnumerableSet`: renamed `get` to `at`. ([#2151](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2151))
- `ERC165Checker`: functions no longer have a leading underscore. ([#2150](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2150))
- `ERC721Metadata`, `ERC721Enumerable`: these contracts were removed, and their functionality merged into `ERC721`. ([#2160](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2160))
- `ERC721`: added a constructor for `name` and `symbol`. ([#2160](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2160))
- `ERC20Detailed`: this contract was removed and its functionality merged into `ERC20`. ([#2161](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2161))
- `ERC20`: added a constructor for `name` and `symbol`. `decimals` now defaults to 18. ([#2161](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2161))
- `Strings`: renamed `fromUint256` to `toString` ([#2188](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2188))

## 2.5.1 (2020-04-24)

### Bugfixes

- `ERC777`: fixed the `_send` and `_approve` internal functions not validating some of their arguments for non-zero addresses. ([#2212](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2212))

## 2.5.0 (2020-02-04)

### New features

- `SafeCast.toUintXX`: new library for integer downcasting, which allows for safe operation on smaller types (e.g. `uint32`) when combined with `SafeMath`. ([#1926](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1926))
- `ERC721Metadata`: added `baseURI`, which can be used for dramatic gas savings when all token URIs share a prefix (e.g. `http://api.myapp.com/tokens/<id>`). ([#1970](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1970))
- `EnumerableSet`: new library for storing enumerable sets of values. Only `AddressSet` is supported in this release. ([#2061](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/2061))
- `Create2`: simple library to make usage of the `CREATE2` opcode easier. ([#1744](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1744))

### Improvements

- `ERC777`: `_burn` is now internal, providing more flexibility and making it easier to create tokens that deflate. ([#1908](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1908))
- `ReentrancyGuard`: greatly improved gas efficiency by using the net gas metering mechanism introduced in the Istanbul hardfork. ([#1992](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1992), [#1996](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1996))
- `ERC777`: improve extensibility by making `_send` and related functions `internal`. ([#2027](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2027))
- `ERC721`: improved revert reason when transferring tokens to a non-recipient contract. ([#2018](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2018))

### Breaking changes

- `ERC165Checker` now requires a minimum Solidity compiler version of 0.5.10. ([#1829](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1829))

## 2.4.0 (2019-10-29)

### New features

- `Address.toPayable`: added a helper to convert between address types without having to resort to low-level casting. ([#1773](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1773))
- Facilities to make metatransaction-enabled contracts through the Gas Station Network. ([#1844](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1844))
- `Address.sendValue`: added a replacement to Solidity's `transfer`, removing the fixed gas stipend. ([#1962](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1962))
- Added replacement for functions that don't forward all gas (which have been deprecated): ([#1976](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1976))
  - `PullPayment.withdrawPaymentsWithGas(address payable payee)`
  - `Escrow.withdrawWithGas(address payable payee)`
- `SafeMath`: added support for custom error messages to `sub`, `div` and `mod` functions. ([#1828](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1828))

### Improvements

- `Address.isContract`: switched from `extcodesize` to `extcodehash` for less gas usage. ([#1802](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1802))
- `ERC20` and `ERC777` updated to throw custom errors on subtraction overflows. ([#1828](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1828))

### Deprecations

- Deprecated functions that don't forward all gas: ([#1976](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1976))
  - `PullPayment.withdrawPayments(address payable payee)`
  - `Escrow.withdraw(address payable payee)`

### Breaking changes

- `Address` now requires a minimum Solidity compiler version of 0.5.5. ([#1802](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1802))
- `SignatureBouncer` has been removed from drafts, both to avoid confusions with the GSN and `GSNRecipientSignature` (previously called `GSNBouncerSignature`) and because the API was not very clear. ([#1879](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1879))

### How to upgrade from 2.4.0-beta

The final 2.4.0 release includes a refactor of the GSN contracts that will be a breaking change for 2.4.0-beta users.

- The default empty implementations of `_preRelayedCall` and `_postRelayedCall` were removed and must now be explicitly implemented always in custom recipients. If your custom recipient didn't include an implementation, you can provide an empty one.
- `GSNRecipient`, `GSNBouncerBase`, and `GSNContext` were all merged into `GSNRecipient`.
- `GSNBouncerSignature` and `GSNBouncerERC20Fee` were renamed to `GSNRecipientSignature` and `GSNRecipientERC20Fee`.
- It is no longer necessary to inherit from `GSNRecipient` when using `GSNRecipientSignature` and `GSNRecipientERC20Fee`.

For example, a contract using `GSNBouncerSignature` would have to be changed in the following way.

```diff
-contract MyDapp is GSNRecipient, GSNBouncerSignature {
+contract MyDapp is GSNRecipientSignature {
```

Refer to the table below to adjust your inheritance list.

| 2.4.0-beta                          | 2.4.0                   |
| ----------------------------------- | ----------------------- |
| `GSNRecipient, GSNBouncerSignature` | `GSNRecipientSignature` |
| `GSNRecipient, GSNBouncerERC20Fee`  | `GSNRecipientERC20Fee`  |
| `GSNBouncerBase`                    | `GSNRecipient`          |

## 2.3.0 (2019-05-27)

### New features

- `ERC1820`: added support for interacting with the [ERC1820](https://eips.ethereum.org/EIPS/eip-1820) registry contract (`IERC1820Registry`), as well as base contracts that can be registered as implementers there. ([#1677](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1677))
- `ERC777`: support for the [ERC777 token](https://eips.ethereum.org/EIPS/eip-777), which has multiple improvements over `ERC20` (but is backwards compatible with it) such as built-in burning, a more straightforward permission system, and optional sender and receiver hooks on transfer (mandatory for contracts!). ([#1684](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1684))
- All contracts now have revert reason strings, which give insight into error conditions, and help debug failing transactions. ([#1704](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1704))

### Improvements

- Reverted the Solidity version bump done in v2.2.0, setting the minimum compiler version to v0.5.0, to prevent unexpected build breakage. Users are encouraged however to stay on top of new compiler releases, which usually include bugfixes. ([#1729](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1729))

### Bugfixes

- `PostDeliveryCrowdsale`: some validations where skipped when paired with other crowdsale flavors, such as `AllowanceCrowdsale`, or `MintableCrowdsale` and `ERC20Capped`, which could cause buyers to not be able to claim their purchased tokens. ([#1721](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1721))
- `ERC20._transfer`: the `from` argument was allowed to be the zero address, so it was possible to internally trigger a transfer of 0 tokens from the zero address. This address is not a valid destinatary of transfers, nor can it give or receive allowance, so this behavior was inconsistent. It now reverts. ([#1752](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1752))

## 2.2.0 (2019-03-14)

### New features

- `ERC20Snapshot`: create snapshots on demand of the token balances and total supply, to later retrieve and e.g. calculate dividends at a past time. ([#1617](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1617))
- `SafeERC20`: `ERC20` contracts with no return value (i.e. that revert on failure) are now supported. ([#1655](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1655))
- `ERC20`: added internal `_approve(address owner, address spender, uint256 value)`, allowing derived contracts to set the allowance of arbitrary accounts. ([#1609](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1609))
- `ERC20Metadata`: added internal `_setTokenURI(string memory tokenURI)`. ([#1618](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1618))
- `TimedCrowdsale`: added internal `_extendTime(uint256 newClosingTime)` as well as `TimedCrowdsaleExtended(uint256 prevClosingTime, uint256 newClosingTime)` event allowing to extend the crowdsale, as long as it hasn't already closed.

### Improvements

- Upgraded the minimum compiler version to v0.5.2: this removes many Solidity warnings that were false positives. ([#1606](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1606))
- `ECDSA`: `recover` no longer accepts malleable signatures (those using upper-range values for `s`, or 0/1 for `v`). ([#1622](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1622))
- `ERC721`'s transfers are now more gas efficient due to removal of unnecessary `SafeMath` calls. ([#1610](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1610))
- Fixed variable shadowing issues. ([#1606](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1606))

### Bugfixes

- (minor) `SafeERC20`: `safeApprove` wasn't properly checking for a zero allowance when attempting to set a non-zero allowance. ([#1647](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1647))

### Breaking changes in drafts

- `TokenMetadata` has been renamed to `ERC20Metadata`. ([#1618](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1618))
- The library `Counter` has been renamed to `Counters` and its API has been improved. See an example in `ERC721`, lines [17](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/3cb4a00fce1da76196ac0ac3a0ae9702b99642b5/contracts/token/ERC721/ERC721.sol#L17) and [204](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/3cb4a00fce1da76196ac0ac3a0ae9702b99642b5/contracts/token/ERC721/ERC721.sol#L204). ([#1610](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1610))

## 2.1.3 (2019-02-26)

- Backported `SafeERC20.safeApprove` bugfix. ([#1647](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1647))

## 2.1.2 (2019-01-17)

- Removed most of the test suite from the npm package, except `PublicRole.behavior.js`, which may be useful to users testing their own `Roles`.

## 2.1.1 (2019-01-04)

- Version bump to avoid conflict in the npm registry.

## 2.1.0 (2019-01-04)

### New features

- Now targeting the 0.5.x line of Solidity compilers. For 0.4.24 support, use version 2.0 of OpenZeppelin.
- `WhitelistCrowdsale`: a crowdsale where only whitelisted accounts (`WhitelistedRole`) can purchase tokens. Adding or removing accounts from the whitelist is done by whitelist admins (`WhitelistAdminRole`). Similar to the pre-2.0 `WhitelistedCrowdsale`. ([#1525](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1525), [#1589](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1589))
- `RefundablePostDeliveryCrowdsale`: replacement for `RefundableCrowdsale` (deprecated, see below) where tokens are only granted once the crowdsale ends (if it meets its goal). ([#1543](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1543))
- `PausableCrowdsale`: allows for pausers (`PauserRole`) to pause token purchases. Other crowdsale operations (e.g. withdrawals and refunds, if applicable) are not affected. ([#832](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/832))
- `ERC20`: `transferFrom` and `_burnFrom ` now emit `Approval` events, to represent the token's state comprehensively through events. ([#1524](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1524))
- `ERC721`: added `_burn(uint256 tokenId)`, replacing the similar deprecated function (see below). ([#1550](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1550))
- `ERC721`: added `_tokensOfOwner(address owner)`, allowing to internally retrieve the array of an account's owned tokens. ([#1522](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1522))
- Crowdsales: all constructors are now `public`, meaning it is not necessary to extend these contracts in order to deploy them. The exception is `FinalizableCrowdsale`, since it is meaningless unless extended. ([#1564](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1564))
- `SignedSafeMath`: added overflow-safe operations for signed integers (`int256`). ([#1559](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1559), [#1588](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1588))

### Improvements

- The compiler version required by `Array` was behind the rest of the library so it was updated to `v0.4.24`. ([#1553](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1553))
- Now conforming to a 4-space indentation code style. ([1508](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1508))
- `ERC20`: more gas efficient due to removed redundant `require`s. ([#1409](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1409))
- `ERC721`: fixed a bug that prevented internal data structures from being properly cleaned, missing potential gas refunds. ([#1539](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1539) and [#1549](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1549))
- `ERC721`: general gas savings on `transferFrom`, `_mint` and `_burn`, due to redundant `require`s and `SSTORE`s. ([#1549](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1549))

### Bugfixes

### Breaking changes

### Deprecations

- `ERC721._burn(address owner, uint256 tokenId)`: due to the `owner` parameter being unnecessary. ([#1550](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1550))
- `RefundableCrowdsale`: due to trading abuse potential on crowdsales that miss their goal. ([#1543](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1543))
