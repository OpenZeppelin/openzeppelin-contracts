// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.7.0) (token/ERC1155/extensions/ERC1155Votes.sol)

pragma solidity ^0.8.0;

import "./ERC1155Supply.sol";
import "../../../governance/utils/VotesMulti.sol";

/**
 * @dev Extension of {ERC1155} to support voting and delegation.
 *
 * This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
 * by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
 * power can be queried through the public accessors {getVotes} and {getPastVotes}.
 *
 * By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
 * requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
 */
abstract contract ERC1155Votes is ERC1155Supply, VotesMulti {
    /**
     * @dev Maximum token supply. Defaults to `type(uint224).max` (2^224^ - 1).
     */
    function _maxSupply() internal view virtual returns (uint224) {
        return type(uint224).max;
    }

    /**
     * @dev Move voting power when tokens are transferred.
     *
     * Emits a {IVotes-DelegateVotesChanged} event.
     */
    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        _transferVotingUnits(from, to, ids, amounts);
        super._afterTokenTransfer(operator, from, to, ids, amounts, data);
    }

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function numCheckpoints(address account, uint256 id) public view virtual returns (uint32) {
        return _numCheckpoints(account, id);
    }

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function checkpoints(
        address account,
        uint256 id,
        uint32 pos
    ) public view virtual returns (Checkpoints.Checkpoint memory) {
        return _checkpoints(account, id, pos);
    }

    /**
     * @dev Returns the balance of `account`.
     */
    function _getVotingUnits(address account, uint256 id) internal view virtual override returns (uint256) {
        return balanceOf(account, id);
    }

    /**
     * @dev Snapshots the totalSupply after it has been increased.
     */
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override {
        super._mint(to, id, amount, data);
        require(totalSupply(id) <= _maxSupply(), "ERC1155Votes: total supply risks overflowing votes");
    }

    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._mintBatch(to, ids, amounts, data);
        for (uint256 i = 0; i < ids.length; i++) {
            require(totalSupply(ids[i]) <= _maxSupply(), "ERC1155Votes: total supply risks overflowing votes");
        }
    }
}
