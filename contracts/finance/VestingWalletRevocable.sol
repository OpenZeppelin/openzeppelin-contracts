// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (finance/VestingWalletRevocable.sol)

pragma solidity ^0.8.20;

import {VestingWallet} from "./VestingWallet.sol";
import {SafeERC20} from "../token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "../token/ERC20/IERC20.sol";
import {Address} from "../utils/Address.sol";

/**
 * @dev Extension of {VestingWallet} that lets the owner revoke the vesting schedule. Unvested ETH and any
 * listed ERC20 tokens are returned to the owner, and the vested amount is frozen at the revocation timestamp.
 *
 * _Available since v5.1._
 */
abstract contract VestingWalletRevocable is VestingWallet {
    using SafeERC20 for IERC20;

    bool private _revoked;
    uint64 private _revokedAt;
    uint256 private _ethAllocationSnapshot;
    mapping(address token => uint256) private _erc20AllocationSnapshot;

    /// @dev The vesting schedule has already been revoked.
    error AlreadyRevoked();

    /// @dev Emitted when the vesting schedule is revoked.
    event VestingRevoked(address indexed owner);

    /// @dev Whether the vesting schedule has been revoked.
    function isRevoked() public view returns (bool) {
        return _revoked;
    }

    /**
     * @dev Revokes the vesting schedule. The unvested portion of ETH and each listed ERC20 token is sent to
     * the owner. Tokens omitted from `tokens` stay in the contract and continue to vest against their on-chain
     * balance at the revocation timestamp.
     *
     * Emits a {VestingRevoked} event.
     */
    function revoke(address[] calldata tokens) external onlyOwner {
        if (_revoked) revert AlreadyRevoked();

        uint64 t = uint64(block.timestamp);
        _revokedAt = t;
        _ethAllocationSnapshot = address(this).balance + released();
        for (uint256 i = 0; i < tokens.length; i++) {
            _erc20AllocationSnapshot[tokens[i]] = IERC20(tokens[i]).balanceOf(address(this)) + released(tokens[i]);
        }
        _revoked = true;

        uint256 unvestedEth = address(this).balance - _vestingSchedule(_ethAllocationSnapshot, t);
        if (unvestedEth > 0) Address.sendValue(payable(owner()), unvestedEth);

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 unvested = IERC20(tokens[i]).balanceOf(address(this)) -
                _vestingSchedule(_erc20AllocationSnapshot[tokens[i]], t);
            if (unvested > 0) IERC20(tokens[i]).safeTransfer(owner(), unvested);
        }

        emit VestingRevoked(owner());
    }

    /// @dev After revocation, returns the vested amount frozen at the revocation timestamp.
    function vestedAmount(uint64 timestamp) public view virtual override returns (uint256) {
        return _revoked ? _vestingSchedule(_ethAllocationSnapshot, _revokedAt) : super.vestedAmount(timestamp);
    }

    /**
     * @dev After revocation, returns the token's vested amount frozen at the revocation timestamp. Tokens
     * omitted from {revoke} keep their on-chain balance and vest against it using the revocation timestamp.
     */
    function vestedAmount(address token, uint64 timestamp) public view virtual override returns (uint256) {
        if (!_revoked) return super.vestedAmount(token, timestamp);
        uint256 snapshot = _erc20AllocationSnapshot[token];
        return snapshot == 0 ? super.vestedAmount(token, _revokedAt) : _vestingSchedule(snapshot, _revokedAt);
    }
}
