### 2.1.0 (unreleased)

New features:
 * `WhitelistCrowdsale`: a crowdsale where only whitelisted accounts (`WhitelistedRole`) can purchase tokens. This attribute is given by a series of whitelisters (`WhitelisterRole`), who can also remove them. Similar to the pre-2.0 `WhitelistedCrowdsale`.
 * `RefundablePostDeliveryCrowdsale`: replacement for the (deprecated) `RefundableCrowdsale`: tokens are only granted once the crowdsale ends (if it meets its goal).
 * `ERC20`: `transferFrom` and `_burnFrom ` now emit `Approval` events, improving dApp support.
 * `ERC721`: added `_burn(uint256 tokenId)`, replacing the (deprecated) old function.
 * `ERC721`: added `_tokensOfOwner(address owner)`, allowing for more extensive `ERC721` customization.

Improvements:
 * All contracts now require solc v0.4.24 or higher.
 * Now conforming to a 4-space indentation code style.
 * `ERC20`: more gas efficient due to removed redundant `require`s.
 * `ERC721`: fixed a bug that prevented internal data structures from being properly cleaned, missing potential gas refunds.
 * `ERC721`: general gas savings on `transferFrom`, `_mint` and `_burn`, due to redudant `require`s and `SSTORE`s.

Bugfixes:

Breaking changes:
 * `ERC721`: deprecated `_burn(address owner, uint256 tokenId)` due to the `owner` parameter being unnecessary.
 * `RefundableCrowdsale`: deprecated due to trading abuse potential on crowdsales that miss their goal.
