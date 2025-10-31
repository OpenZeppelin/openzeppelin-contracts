// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (governance/utils/VotesExtended.sol)
pragma solidity ^0.8.26;

import {ERC20} from "../ERC20.sol";
import {MultiVotes} from "../../../governance/utils/MultiVotes.sol";
import {Checkpoints} from "../../../utils/structs/Checkpoints.sol";

/**
 * @dev Extension of ERC-20 to support Compound-like voting and delegation with partial delegations included.
 * This version is more generic than Compound's, and supports token supply up to 2^208^ - 1, while COMP is limited to 2^96^ - 1.
 *
 * NOTE: This contract does not provide interface compatibility with Compound's COMP token.
 *
 * This extension keeps a history (checkpoints) of each account's vote power.
 * The default delegate that receives all available voting power is assigned by calling {MultiVotes-delegate}
 * or by providing a signature to be used with {Votes-delegateBySig}. Partial static delegations can be assigned
 * by calling {MultiVotes-multiDelegate}.
 * Voting power can be queried through the public accessors {MultiVotes-getVotes} and {MultiVotes-getPastVotes}.
 *
 * By default, undelegated voting power is assigned to the zero address, this may require users to delegate
 * voting power to themselves
 */
abstract contract ERC20MultiVotes is ERC20, MultiVotes {
    /**
     * @dev Total supply cap has been exceeded, introducing a risk of votes overflowing.
     */
    error ERC20ExceededSafeSupply(uint256 increasedSupply, uint256 cap);

    /**
     * @dev Maximum token supply. Defaults to `type(uint208).max` (2^208^ - 1).
     *
     * This maximum is enforced in {_update}. It limits the total supply of the token, which is otherwise a uint256,
     * so that checkpoints can be stored in the Trace208 structure used by {Votes}. Increasing this value will not
     * remove the underlying limitation, and will cause {_update} to fail because of a math overflow in
     * {Votes-_transferVotingUnits}. An override could be used to further restrict the total supply (to a lower value) if
     * additional logic requires it. When resolving override conflicts on this function, the minimum should be
     * returned.
     */
    function _maxSupply() internal view virtual returns (uint256) {
        return type(uint208).max;
    }

    /**
     * @dev Move voting power when tokens are transferred.
     *
     * Emits a {IMultiVotes-DelegateVotesChanged} event.
     */
    function _update(address from, address to, uint256 value) internal virtual override {
        if (from == address(0)) {
            uint256 supply = totalSupply() + value;
            uint256 cap = _maxSupply();
            if (supply > cap) {
                revert ERC20ExceededSafeSupply(supply, cap);
            }
        }
        _transferVotingUnits(from, to, value);
        super._update(from, to, value);
    }

    /**
     * @dev Returns the voting units of an `account`.
     *
     * WARNING: Overriding this function may compromise the internal vote accounting.
     * `ERC20Votes` assumes tokens map to voting units 1:1 and this is not easy to change.
     */
    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account);
    }

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function numCheckpoints(address account) public view virtual returns (uint32) {
        return _numCheckpoints(account);
    }

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function checkpoints(address account, uint32 pos) public view virtual returns (Checkpoints.Checkpoint208 memory) {
        return _checkpoints(account, pos);
    }
}
