// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (finance/VestingWalletRevocable.sol)

pragma solidity ^0.8.20;

import {VestingWallet} from "./VestingWallet.sol";
import {SafeERC20} from "../token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "../token/ERC20/IERC20.sol";

/**
 * @dev Extension of {VestingWallet} that allows the owner to revoke the vesting schedule.
 *
 * When revoked, the vesting calculation is frozen at the revocation timestamp, and any unvested
 * tokens are returned to the owner. This contract snapshots the total allocation at revocation
 * time to ensure the vested amount remains constant post-revocation.
 *
 * _Available since v5.1._
 */
abstract contract VestingWalletRevocable is VestingWallet {
    using SafeERC20 for IERC20;

    bool private _revoked;
    uint256 private _ethAllocationSnapshot;
    mapping(address token => uint256) private _erc20AllocationSnapshot;

    /// @dev The vesting schedule has already been revoked.
    error AlreadyRevoked();

    /// @dev Emitted when the vesting schedule is revoked.
    event VestingRevoked(address indexed owner);

    /**
     * @dev Getter for the revocation status.
     */
    function isRevoked() public view returns (bool) {
        return _revoked;
    }

    /**
     * @dev Revokes the vesting schedule and returns all unvested tokens to the owner.
     *
     * Requirements:
     * - The vesting schedule must not have been revoked already.
     * - Only the owner can call this function.
     *
     * @param tokens Array of ERC20 token addresses to revoke. ETH is automatically handled.
     *
     * Emits a {VestingRevoked} event.
     */
    function revoke(address[] calldata tokens) external onlyOwner {
        // Checks against double revoking
        if (_revoked) revert AlreadyRevoked();

        // Snapshot allocations before any transfers
        _etherAllocationSnapshot = address(this).balance + released();
        for (uint256 i = 0; i < tokens.length; i++) {
            _erc20AllocationSnapshot[tokens[i]] = IERC20(tokens[i]).balanceOf(address(this)) + released(tokens[i]);
        }

        _revoked = true;

        // Return unvested ETH to owner
        uint256 unvestedEth = address(this).balance - vestedAmount(uint64(block.timestamp));
        if (unvestedEth > 0) {
            payable(owner()).transfer(unvestedEth);
        }

        // Return unvested ERC-20s to owner
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 unvested = IERC20(tokens[i]).balanceOf(address(this)) -
                vestedAmount(tokens[i], uint64(block.timestamp));
            if (unvested > 0) {
                IERC20(tokens[i]).safeTransfer(owner(), unvested);
            }
        }

        emit VestingRevoked(owner());
    }

    /**
     * @dev Overrides the vesting calculation to use the snapshotted allocation after revocation.
     *
     * If the vesting has been revoked, returns the vested amount based on the allocation at the
     * time of revocation. Otherwise, delegates to the parent implementation.
     */
    function vestedAmount(uint64 timestamp) public view virtual override returns (uint256) {
        if (_revoked) {
            return _vestingSchedule(_ethAllocationSnapshot, timestamp);
        }
        return super.vestedAmount(timestamp);
    }

    /**
     * @dev Overrides the vesting calculation for ERC20 tokens to use the snapshotted allocation after revocation.
     *
     * If the vesting has been revoked, returns the vested amount based on the token allocation at the
     * time of revocation. Otherwise, delegates to the parent implementation.
     */
    function vestedAmount(address token, uint64 timestamp) public view virtual override returns (uint256) {
        if (_revoked) {
            return _vestingSchedule(_erc20AllocationSnapshot[token], timestamp);
        }
        return super.vestedAmount(token, timestamp);
    }
}
