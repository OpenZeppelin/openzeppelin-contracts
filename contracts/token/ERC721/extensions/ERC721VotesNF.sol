// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC721/extensions/draft-ERC721Votes.sol)

pragma solidity ^0.8.4;

import "../ERC721.sol";
import "../../../governance/utils/Votes.sol";

/**
 * @dev Extension of ERC721 to support voting and delegation as implemented by {VotesForces}, where every NFT may
 * have different voting power.
 *
 * All tokens count as votes, even if not delegated. There's no need to delegate to oneself.
 * There's an additional cost for every token transfer (more gas).
 * Token holders may cast their vote themselves or delegate their vote to a representative.
 *
 */
abstract contract ERC721VotesNF is ERC721, Votes {
    // Track the current undelegated balance for each account.
    // this allows to support different voting power for different tokens
    mapping(address => uint256) private _unitsBalance;

    /**
     * @dev Calculate the voting power of each token
     * token weight exected to remain consistent and immutable.
     */
    function powerOfToken(uint256) public pure virtual returns (uint256) {
        return 1;
    }

    /**
     * @dev Must return the voting units held by an account.
     */
    function _getVotingUnits(address account) internal view override returns (uint256) {
        return _unitsBalance[account];
    }

    /**
     * @dev Track all power-adjusted balanced
     */
    function _transferVotingUnits(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (from != address(0)) {
            //Units Removed
            _unitsBalance[from] = _unitsBalance[from] - amount;
        }
        if (to != address(0)) {
            //Units Added
            _unitsBalance[to] = _unitsBalance[to] + amount;
        }
        super._transferVotingUnits(from, to, amount);
    }

    /**
     * @dev Adjusts votes when tokens are transferred.
     *
     * Emits a {IVotes-DelegateVotesChanged} event.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        _transferVotingUnits(from, to, powerOfToken(tokenId));
        super._afterTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Adjusts votes when a batch of tokens is transferred.
     *
     * Emits a {IVotes-DelegateVotesChanged} event.
     */
    function _afterConsecutiveTokenTransfer(
        address from,
        address to,
        uint256 first,
        uint96 size
    ) internal virtual override {
        for (uint256 i = 0; i < size; ++i) {
            _transferVotingUnits(from, to, powerOfToken(first + i));
        }
        super._afterConsecutiveTokenTransfer(from, to, first, size);
    }
}
