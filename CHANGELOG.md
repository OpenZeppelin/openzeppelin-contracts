# Changelog

## 2.5.1 (2020-04-24)

### Bugfixes
 * `ERC777`: fixed the `_send` and `_approve` internal functions not validating some of their arguments for non-zero addresses. ([#2212](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2212))

## 2.5.0 (2020-02-04)

### New features
 * `SafeCast.toUintXX`: new library for integer downcasting, which allows for safe operation on smaller types (e.g. `uint32`) when combined with `SafeMath`. ([#1926](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1926))
 * `ERC721Metadata`: added `baseURI`, which can be used for dramatic gas savings when all token URIs share a prefix (e.g. `http://api.myapp.com/tokens/<id>`). ([#1970](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1970))
 * `EnumerableSet`: new library for storing enumerable sets of values. Only `AddressSet` is supported in this release. ([#2061](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/2061))
 * `Create2`: simple library to make usage of the `CREATE2` opcode easier. ([#1744](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1744))

### Improvements
 * `ERC777`: `_burn` is now internal, providing more flexibility and making it easier to create tokens that deflate. ([#1908](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1908))
 * `ReentrancyGuard`: greatly improved gas efficiency by using the net gas metering mechanism introduced in the Istanbul hardfork. ([#1992](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1992), [#1996](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1996))
 * `ERC777`: improve extensibility by making `_send` and related functions `internal`. ([#2027](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2027))
 * `ERC721`: improved revert reason when transferring tokens to a non-recipient contract. ([#2018](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/2018))

### Breaking changes
 * `ERC165Checker` now requires a minimum Solidity compiler version of 0.5.10. ([#1829](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1829))

## 2.4.0 (2019-10-29)

### New features
 * `Address.toPayable`: added a helper to convert between address types without having to resort to low-level casting. ([#1773](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1773))
 * Facilities to make metatransaction-enabled contracts through the Gas Station Network. ([#1844](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1844))
 * `Address.sendValue`: added a replacement to Solidity's `transfer`, removing the fixed gas stipend. ([#1962](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1962))
 * Added replacement for functions that don't forward all gas (which have been deprecated): ([#1976](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1976))
   * `PullPayment.withdrawPaymentsWithGas(address payable payee)`
   * `Escrow.withdrawWithGas(address payable payee)`
 * `SafeMath`: added support for custom error messages to `sub`, `div` and `mod` functions. ([#1828](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1828))

### Improvements
 * `Address.isContract`: switched from `extcodesize` to `extcodehash` for less gas usage. ([#1802](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1802))
 * `ERC20` and `ERC777` updated to throw custom errors on subtraction overflows. ([#1828](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1828))

### Deprecations
 * Deprecated functions that don't forward all gas: ([#1976](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1976))
   * `PullPayment.withdrawPayments(address payable payee)`
   * `Escrow.withdraw(address payable payee)`

### Breaking changes
 * `Address` now requires a minimum Solidity compiler version of 0.5.5. ([#1802](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1802))
 * `SignatureBouncer` has been removed from drafts, both to avoid confusions with the GSN and `GSNRecipientSignature` (previously called `GSNBouncerSignature`) and because the API was not very clear. ([#1879](https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1879))

### How to upgrade from 2.4.0-beta

The final 2.4.0 release includes a refactor of the GSN contracts that will be a breaking change for 2.4.0-beta users.

 * The default empty implementations of `_preRelayedCall` and `_postRelayedCall` were removed and must now be explicitly implemented always in custom recipients. If your custom recipient didn't include an implementation, you can provide an empty one.
 * `GSNRecipient`, `GSNBouncerBase`, and `GSNContext` were all merged into `GSNRecipient`.
 * `GSNBouncerSignature` and `GSNBouncerERC20Fee` were renamed to `GSNRecipientSignature` and `GSNRecipientERC20Fee`.
 * It is no longer necessary to inherit from `GSNRecipient` when using `GSNRecipientSignature` and `GSNRecipientERC20Fee`.

For example, a contract using `GSNBouncerSignature` would have to be changed in the following way.

```diff
-contract MyDapp is GSNRecipient, GSNBouncerSignature {
+contract MyDapp is GSNRecipientSignature {
```

Refer to the table below to adjust your inheritance list.

| 2.4.0-beta                         | 2.4.0                        |
| ---------------------------------- | ---------------------------- |
| `GSNRecipient, GSNBouncerSignature`| `GSNRecipientSignature`      |
| `GSNRecipient, GSNBouncerERC20Fee` | `GSNRecipientERC20Fee`       |
| `GSNBouncerBase`                   | `GSNRecipient`               |

## 2.3.0 (2019-05-27)

### New features
 * `ERC1820`: added support for interacting with the [ERC1820](https://eips.ethereum.org/EIPS/eip-1820) registry contract (`IERC1820Registry`), as well as base contracts that can be registered as implementers there. ([#1677](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1677))
 * `ERC777`: support for the [ERC777 token](https://eips.ethereum.org/EIPS/eip-777), which has multiple improvements over `ERC20` (but is backwards compatible with it) such as built-in burning, a more  straightforward permission system, and optional sender and receiver hooks on transfer (mandatory for contracts!). ([#1684](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1684))
 * All contracts now have revert reason strings, which give insight into error conditions, and help debug failing transactions. ([#1704](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1704))

### Improvements
 * Reverted the Solidity version bump done in v2.2.0, setting the minimum compiler version to v0.5.0, to prevent unexpected build breakage. Users are encouraged however to stay on top of new compiler releases, which usually include bugfixes. ([#1729](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1729))

### Bugfixes
 * `PostDeliveryCrowdsale`: some validations where skipped when paired with other crowdsale flavors, such as `AllowanceCrowdsale`, or `MintableCrowdsale` and `ERC20Capped`, which could cause buyers to not be able to claim their purchased tokens. ([#1721](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1721))
 * `ERC20._transfer`: the `from` argument was allowed to be the zero address, so it was possible to internally trigger a transfer of 0 tokens from the zero address. This address is not a valid destinatary of transfers, nor can it give or receive allowance, so this behavior was inconsistent. It now reverts. ([#1752](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1752))

## 2.2.0 (2019-03-14)

### New features
 * `ERC20Snapshot`: create snapshots on demand of the token balances and total supply, to later retrieve and e.g. calculate dividends at a past time. ([#1617](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1617))
 * `SafeERC20`: `ERC20` contracts with no return value (i.e. that revert on failure) are now supported. ([#1655](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1655))
 * `ERC20`: added internal `_approve(address owner, address spender, uint256 value)`, allowing derived contracts to set the allowance of arbitrary accounts. ([#1609](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1609))
 * `ERC20Metadata`: added internal `_setTokenURI(string memory tokenURI)`. ([#1618](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1618))
 * `TimedCrowdsale`: added internal `_extendTime(uint256 newClosingTime)` as well as `TimedCrowdsaleExtended(uint256 prevClosingTime, uint256 newClosingTime)` event allowing to extend the crowdsale, as long as it hasn't already closed.

### Improvements
 * Upgraded the minimum compiler version to v0.5.2: this removes many Solidity warnings that were false positives. ([#1606](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1606))
 * `ECDSA`: `recover` no longer accepts malleable signatures (those using upper-range values for `s`, or 0/1 for `v`). ([#1622](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1622))
 * `ERC721`'s transfers are now more gas efficient due to removal of unnecessary `SafeMath` calls. ([#1610](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1610))
 * Fixed variable shadowing issues. ([#1606](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1606))

### Bugfixes
 * (minor) `SafeERC20`: `safeApprove` wasn't properly checking for a zero allowance when attempting to set a non-zero allowance. ([#1647](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1647))

### Breaking changes in drafts
 * `TokenMetadata` has been renamed to `ERC20Metadata`. ([#1618](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1618))
 * The library `Counter` has been renamed to `Counters` and its API has been improved. See an example in `ERC721`, lines [17](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/3cb4a00fce1da76196ac0ac3a0ae9702b99642b5/contracts/token/ERC721/ERC721.sol#L17) and [204](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/3cb4a00fce1da76196ac0ac3a0ae9702b99642b5/contracts/token/ERC721/ERC721.sol#L204). ([#1610](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1610))

## 2.1.3 (2019-02-26)
 * Backported `SafeERC20.safeApprove` bugfix. ([#1647](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1647))

## 2.1.2 (2019-01-17)
 * Removed most of the test suite from the npm package, except `PublicRole.behavior.js`, which may be useful to users testing their own `Roles`.

## 2.1.1 (2019-01-04)
 * Version bump to avoid conflict in the npm registry.

## 2.1.0 (2019-01-04)

### New features
 * Now targeting the 0.5.x line of Solidity compilers. For 0.4.24 support, use version 2.0 of OpenZeppelin.
 * `WhitelistCrowdsale`: a crowdsale where only whitelisted accounts (`WhitelistedRole`) can purchase tokens. Adding or removing accounts from the whitelist is done by whitelist admins (`WhitelistAdminRole`). Similar to the pre-2.0 `WhitelistedCrowdsale`. ([#1525](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1525), [#1589](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1589))
 * `RefundablePostDeliveryCrowdsale`: replacement for `RefundableCrowdsale` (deprecated, see below) where tokens are only granted once the crowdsale ends (if it meets its goal). ([#1543](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1543))
 * `PausableCrowdsale`: allows for pausers (`PauserRole`) to pause token purchases. Other crowdsale operations (e.g. withdrawals and refunds, if applicable) are not affected. ([#832](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/832))
 * `ERC20`: `transferFrom` and `_burnFrom ` now emit `Approval` events, to represent the token's state comprehensively through events. ([#1524](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1524))
 * `ERC721`: added `_burn(uint256 tokenId)`, replacing the similar deprecated function (see below). ([#1550](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1550))
 * `ERC721`: added `_tokensOfOwner(address owner)`, allowing to internally retrieve the array of an account's owned tokens. ([#1522](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1522))
 * Crowdsales: all constructors are now `public`, meaning it is not necessary to extend these contracts in order to deploy them. The exception is `FinalizableCrowdsale`, since it is meaningless unless extended. ([#1564](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1564))
 * `SignedSafeMath`: added overflow-safe operations for signed integers (`int256`). ([#1559](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1559), [#1588](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1588))

### Improvements
 * The compiler version required by `Array` was behind the rest of the libray so it was updated to `v0.4.24`. ([#1553](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1553))
 * Now conforming to a 4-space indentation code style. ([1508](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1508))
 * `ERC20`: more gas efficient due to removed redundant `require`s. ([#1409](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1409))
 * `ERC721`: fixed a bug that prevented internal data structures from being properly cleaned, missing potential gas refunds. ([#1539](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1539) and [#1549](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1549))
 * `ERC721`: general gas savings on `transferFrom`, `_mint` and `_burn`, due to redudant `require`s and `SSTORE`s. ([#1549](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1549))

### Bugfixes

### Breaking changes

### Deprecations
 * `ERC721._burn(address owner, uint256 tokenId)`: due to the `owner` parameter being unnecessary. ([#1550](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1550))
 * `RefundableCrowdsale`: due to trading abuse potential on crowdsales that miss their goal. ([#1543](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1543))
