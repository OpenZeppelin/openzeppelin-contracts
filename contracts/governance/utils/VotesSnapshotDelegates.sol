// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Checkpoints} from "../../utils/structs/Checkpoints.sol";
import {Votes} from "./Votes.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";

abstract contract VotesSnapshotDelegates is Votes {
    using Checkpoints for Checkpoints.Trace208;

    mapping(address delegatee => Checkpoints.Trace208) private _delegateCheckpoints;

    function _delegate(address account, address delegatee) internal override {
        address oldDelegate = delegates(account);

        _delegateCheckpoints[account].push(clock(), uint160(delegatee));

        emit DelegateChanged(account, oldDelegate, delegatee);
        _moveDelegateVotes(oldDelegate, delegatee, _getVotingUnits(account));
    }

    function delegates(address delegatee) public view override returns (address) {
        return address(uint160(_delegateCheckpoints[delegatee].latest()));
    }

    function getPastDelegate(address account, uint256 timepoint) public view returns (address) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) {
            revert ERC5805FutureLookup(timepoint, currentTimepoint);
        }
        return address(uint160(_delegateCheckpoints[account].upperLookupRecent(SafeCast.toUint48(timepoint))));
    }
}
