// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Checkpoints} from "../../../utils/structs/Checkpoints.sol";
import {SafeCast} from "../../../utils/math/SafeCast.sol";

import {IERC20Permit} from "./IERC20Permit.sol";
import {ERC20} from "../ERC20.sol";
import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {Nonces} from "../../../utils/Nonces.sol";
import {IERC6372} from "../../../interfaces/IERC6372.sol";
import {Time} from "../../../utils/types/Time.sol";

abstract contract ERC20SnapshotBalance is ERC20, IERC6372 {
    using Checkpoints for Checkpoints.Trace208;
    mapping(address account => Checkpoints.Trace208) private _balanceOfCheckpoints;

    error ERC6372FutureLookup(uint256 timepoint, uint48 clock);

    /**
     * @notice Returns the balance of an account at a specific timepoint.
     * @param account The address of the account to check.
     * @param timepoint The timepoint to check the balance at (by default block number).
     */
    function getPastBalanceOf(address account, uint256 timepoint) public view returns (uint256) {
        uint48 currentTimepoint = clock();
        if (timepoint >= currentTimepoint) {
            revert ERC6372FutureLookup(timepoint, currentTimepoint);
        }
        return _balanceOfCheckpoints[account].upperLookupRecent(SafeCast.toUint48(timepoint));
    }

    /**
     * @dev Adds historical checkpoints to the balance of each account.
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        if (from != to) {
            if (from != address(0)) {
                Checkpoints.Trace208 storage store = _balanceOfCheckpoints[from];
                store.push(clock(), uint208(store.latest() - value));
            }
            if (to != address(0)) {
                Checkpoints.Trace208 storage store = _balanceOfCheckpoints[to];
                store.push(clock(), uint208(store.latest() + value));
            }
        }
        super._update(from, to, value);
    }

    /**
     * @dev Clock used for flagging checkpoints. Can be overridden to implement timestamp based
     * checkpoints (and voting), in which case {CLOCK_MODE} should be overridden as well to match.
     */
    function clock() public view virtual returns (uint48);
}
