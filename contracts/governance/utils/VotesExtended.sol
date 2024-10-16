// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Checkpoints} from "../../utils/structs/Checkpoints.sol";
import {Votes} from "./Votes.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";

/**
 * @dev Extension of {Votes} that adds exposes checkpoints for delegations and balances.
 */
abstract contract VotesExtended is Votes {
    using SafeCast for uint256;
    using Checkpoints for Checkpoints.Trace160;
    using Checkpoints for Checkpoints.Trace208;

    mapping(address delegatee => Checkpoints.Trace160) private _delegateCheckpoints;
    mapping(address account => Checkpoints.Trace208) private _balanceOfCheckpoints;

    /**
     * @dev Returns the delegate of an `account` at a specific moment in the past. If the `clock()` is
     * configured to use block numbers, this will return the value at the end of the corresponding block.
     *
     * Requirements:
     *
     * - `timepoint` must be in the past. If operating using block numbers, the block must be already mined.
     */
    function getPastDelegate(address account, uint256 timepoint) public view virtual returns (address) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) {
            revert ERC5805FutureLookup(timepoint, currentTimepoint);
        }
        return address(_delegateCheckpoints[account].upperLookupRecent(timepoint.toUint48()));
    }

    /**
     * @dev Returns the `balanceOf` of an `account` at a specific moment in the past. If the `clock()` is
     * configured to use block numbers, this will return the value at the end of the corresponding block.
     *
     * Requirements:
     *
     * - `timepoint` must be in the past. If operating using block numbers, the block must be already mined.
     */
    function getPastBalanceOf(address account, uint256 timepoint) public view virtual returns (uint256) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) {
            revert ERC5805FutureLookup(timepoint, currentTimepoint);
        }
        return _balanceOfCheckpoints[account].upperLookupRecent(timepoint.toUint48());
    }

    /// @inheritdoc Votes
    function _delegate(address account, address delegatee) internal virtual override {
        super._delegate(account, delegatee);

        _delegateCheckpoints[account].push(clock(), uint160(delegatee));
    }

    /// @inheritdoc Votes
    function _transferVotingUnits(address from, address to, uint256 amount) internal virtual override {
        super._transferVotingUnits(from, to, amount);
        if (from != to) {
            if (from != address(0)) {
                _balanceOfCheckpoints[from].push(clock(), _getVotingUnits(from).toUint208());
            }
            if (to != address(0)) {
                _balanceOfCheckpoints[to].push(clock(), _getVotingUnits(to).toUint208());
            }
        }
    }
}
