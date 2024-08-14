// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Checkpoints} from "../../utils/structs/Checkpoints.sol";
import {Votes} from "./Votes.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";

abstract contract VotesOverridable is Votes {
    using Checkpoints for Checkpoints.Trace208;

    mapping(address delegatee => Checkpoints.Trace208) private _delegateCheckpoints;
    mapping(address account => Checkpoints.Trace208) private _balanceOfCheckpoints;

    function _delegate(address account, address delegatee) internal virtual override {
        address oldDelegate = delegates(account);

        _delegateCheckpoints[account].push(clock(), uint160(delegatee));

        emit DelegateChanged(account, oldDelegate, delegatee);
        _moveDelegateVotes(oldDelegate, delegatee, _getVotingUnits(account));
    }

    function delegates(address delegatee) public view virtual override returns (address) {
        return address(uint160(_delegateCheckpoints[delegatee].latest()));
    }

    function getPastDelegate(address account, uint256 timepoint) public view returns (address) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) {
            revert ERC5805FutureLookup(timepoint, currentTimepoint);
        }
        return address(uint160(_delegateCheckpoints[account].upperLookupRecent(SafeCast.toUint48(timepoint))));
    }

    function _transferVotingUnits(address from, address to, uint256 amount) internal virtual override {
        super._transferVotingUnits(from, to, amount);
        if (from != to) {
            if (from != address(0)) {
                Checkpoints.Trace208 storage store = _balanceOfCheckpoints[from];
                store.push(clock(), uint208(store.latest() - amount));
            }
            if (to != address(0)) {
                Checkpoints.Trace208 storage store = _balanceOfCheckpoints[to];
                store.push(clock(), uint208(store.latest() + amount));
            }
        }
    }

    /**
     * @notice Returns the balance of an account at a specific timepoint.
     * @param account The address of the account to check.
     * @param timepoint The timepoint to check the balance at (by default block number).
     */
    function getPastBalanceOf(address account, uint256 timepoint) public view returns (uint256) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) {
            // Note this ERC is not relevant to the specific error. Should probably be a different error.
            revert ERC5805FutureLookup(timepoint, currentTimepoint);
        }
        return _balanceOfCheckpoints[account].upperLookupRecent(SafeCast.toUint48(timepoint));
    }
}
