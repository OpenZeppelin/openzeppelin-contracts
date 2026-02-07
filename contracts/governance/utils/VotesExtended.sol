// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (governance/utils/VotesExtended.sol)

pragma solidity ^0.8.24;

import {Checkpoints} from "../../utils/structs/Checkpoints.sol";
import {Votes} from "./Votes.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";

/**
 * @dev Extension of {Votes} that adds checkpoints for delegations and balances.
 *
 * WARNING: While this contract extends {Votes}, valid uses of {Votes} may not be compatible with
 * {VotesExtended} without additional considerations. This implementation of {_transferVotingUnits} must
 * run AFTER the voting weight movement is registered, such that it is reflected on {_getVotingUnits}.
 *
 * Said differently, {VotesExtended} MUST be integrated in a way that calls {_transferVotingUnits} AFTER the
 * asset transfer is registered and balances are updated:
 *
 * ```solidity
 * contract VotingToken is Token, VotesExtended {
 *   function transfer(address from, address to, uint256 tokenId) public override {
 *     super.transfer(from, to, tokenId); // <- Perform the transfer first ...
 *     _transferVotingUnits(from, to, 1); // <- ... then call _transferVotingUnits.
 *   }
 *
 *   function _getVotingUnits(address account) internal view override returns (uint256) {
 *      return balanceOf(account);
 *   }
 * }
 * ```
 *
 * {ERC20Votes} and {ERC721Votes} follow this pattern and are thus safe to use with {VotesExtended}.
 */
abstract contract VotesExtended is Votes {
    using Checkpoints for Checkpoints.Trace160;
    using Checkpoints for Checkpoints.Trace208;

    mapping(address delegator => Checkpoints.Trace160) private _userDelegationCheckpoints;
    mapping(address account => Checkpoints.Trace208) private _userVotingUnitsCheckpoints;

    /**
     * @dev Returns the delegate of an `account` at a specific moment in the past. If the `clock()` is
     * configured to use block numbers, this will return the value at the end of the corresponding block.
     *
     * Requirements:
     *
     * - `timepoint` must be in the past. If operating using block numbers, the block must be already mined.
     */
    function getPastDelegate(address account, uint256 timepoint) public view virtual returns (address) {
        return address(_userDelegationCheckpoints[account].upperLookupRecent(_validateTimepoint(timepoint)));
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
        return _userVotingUnitsCheckpoints[account].upperLookupRecent(_validateTimepoint(timepoint));
    }

    /// @inheritdoc Votes
    function _delegate(address account, address delegatee) internal virtual override {
        super._delegate(account, delegatee);

        _userDelegationCheckpoints[account].push(clock(), uint160(delegatee));
    }

    /// @inheritdoc Votes
    function _transferVotingUnits(address from, address to, uint256 amount) internal virtual override {
        super._transferVotingUnits(from, to, amount);
        if (from != to) {
            if (from != address(0)) {
                _userVotingUnitsCheckpoints[from].push(clock(), SafeCast.toUint208(_getVotingUnits(from)));
            }
            if (to != address(0)) {
                _userVotingUnitsCheckpoints[to].push(clock(), SafeCast.toUint208(_getVotingUnits(to)));
            }
        }
    }
}
