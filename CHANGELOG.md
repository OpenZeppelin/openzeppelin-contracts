# Changelog

## 2.2.0 (2019-03-14)

### New features:
 * `ERC20Snapshot`: create snapshots on demand of the token balances and total supply, to later retrieve and e.g. calculate dividends at a past time. ([#1617](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1617))
 * `SafeERC20`: `ERC20` contracts with no return value (i.e. that revert on failure) are now supported. ([#1655](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/))
 * `ERC20`: added internal `_approve(address owner, address spender, uint256 value)`, allowing derived contracts to set the allowance of arbitrary accounts. ([#1609](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1609))
 * `ERC20Metadata`: added internal `_setTokenURI(string memory tokenURI)`. ([#1618](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1618))
 * `TimedCrowdsale`: added internal `_extendTime(uint256 newClosingTime)` as well as `TimedCrowdsaleExtended(uint256 prevClosingTime, uint256 newClosingTime)` event allowing to extend the crowdsale, as long as it hasn't already closed.

### Improvements:
 * Upgraded the minimum compiler version to v0.5.2: this removes many Solidity warnings that were false positives. ([#1606](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1606))
 * `ECDSA`: `recover` no longer accepts malleable signatures (those using upper-range values for `s`, or 0/1 for `v`). ([#1622](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1622))
 * `ERC721`'s transfers are now more gas efficient due to removal of unnecessary `SafeMath` calls. ([#1610](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1610))
 * `Counter`'s API has been improved, and is now used by `ERC721` (though it is still in `drafts`). ([#1610](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1610))
 * Fixed variable shadowing issues. ([#1606](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1606))

### Bugfixes:
 * (minor) `SafeERC20`: `safeApprove` wasn't properly checking for a zero allowance when attempting to set a non-zero allowance. ([#1647](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1647))

### Breaking changes:
 * `TokenMetadata` (in drafts) has been renamed to `ERC20Metadata`. ([#1618](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1618))

## 2.1.3 (2019-02-26)
 * Backported `SafeERC20.safeApprove` bugfix. ([#1647](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1647))

## 2.1.2 (2019-01-17)
 * Removed most of the test suite from the npm package, except `PublicRole.behavior.js`, which may be useful to users testing their own `Roles`.

## 2.1.1 (2019-01-04)
 * Version bump to avoid conflict in the npm registry.

## 2.1.0 (2019-01-04)

### New features:
 * Now targeting the 0.5.x line of Solidity compilers. For 0.4.24 support, use version 2.0 of OpenZeppelin.
 * `WhitelistCrowdsale`: a crowdsale where only whitelisted accounts (`WhitelistedRole`) can purchase tokens. Adding or removing accounts from the whitelist is done by whitelist admins (`WhitelistAdminRole`). Similar to the pre-2.0 `WhitelistedCrowdsale`. ([#1525](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1525), [#1589](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1589))
 * `RefundablePostDeliveryCrowdsale`: replacement for `RefundableCrowdsale` (deprecated, see below) where tokens are only granted once the crowdsale ends (if it meets its goal). ([#1543](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1543))
 * `PausableCrowdsale`: allows for pausers (`PauserRole`) to pause token purchases. Other crowdsale operations (e.g. withdrawals and refunds, if applicable) are not affected. ([#832](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/832))
 * `ERC20`: `transferFrom` and `_burnFrom ` now emit `Approval` events, to represent the token's state comprehensively through events. ([#1524](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1524))
 * `ERC721`: added `_burn(uint256 tokenId)`, replacing the similar deprecated function (see below). ([#1550](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1550))
 * `ERC721`: added `_tokensOfOwner(address owner)`, allowing to internally retrieve the array of an account's owned tokens. ([#1522](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1522))
 * Crowdsales: all constructors are now `public`, meaning it is not necessary to extend these contracts in order to deploy them. The exception is `FinalizableCrowdsale`, since it is meaningless unless extended. ([#1564](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1564))
 * `SignedSafeMath`: added overflow-safe operations for signed integers (`int256`). ([#1559](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1559), [#1588](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1588))

### Improvements:
 * The compiler version required by `Array` was behind the rest of the libray so it was updated to `v0.4.24`. ([#1553](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1553))
 * Now conforming to a 4-space indentation code style. ([1508](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1508))
 * `ERC20`: more gas efficient due to removed redundant `require`s. ([#1409](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1409))
 * `ERC721`: fixed a bug that prevented internal data structures from being properly cleaned, missing potential gas refunds. ([#1539](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1539) and [#1549](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1549))
 * `ERC721`: general gas savings on `transferFrom`, `_mint` and `_burn`, due to redudant `require`s and `SSTORE`s. ([#1549](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1549))

### Bugfixes:

### Breaking changes:

### Deprecations:
 * `ERC721._burn(address owner, uint256 tokenId)`: due to the `owner` parameter being unnecessary. ([#1550](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1550))
 * `RefundableCrowdsale`: due to trading abuse potential on crowdsales that miss their goal. ([#1543](https://github.com/OpenZeppelin/openzeppelin-solidity/pull/1543))
