// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC20} from "../token/ERC20/IERC20.sol";
import {SafeERC20} from "../token/ERC20/utils/SafeERC20.sol";
import {Address} from "../utils/Address.sol";
import {VestingWallet} from "./VestingWallet.sol";

/**
 * @dev Extension of {VestingWallet} that adds revocation per asset.
 *
 * The beneficiary remains the contract owner inherited from {VestingWallet}. A separate revoker account can cancel the
 * vesting of the native asset or of specific ERC-20 tokens. When an asset is revoked, the vesting schedule for that
 * asset is frozen at the revocation timestamp, the unvested portion is returned to the revoker, and the vested portion
 * remains claimable by the beneficiary.
 *
 * NOTE: Assets transferred to the contract after they have been revoked for a given asset type are not included in the
 * frozen historical allocation used for vesting calculations.
 */
contract VestingWalletRevocable is VestingWallet {
    event EtherRevoked(uint256 amount);
    event ERC20Revoked(address indexed token, uint256 amount);

    error VestingWalletInvalidRevoker(address revoker);
    error VestingWalletUnauthorizedRevoker(address account);
    error VestingWalletEtherAlreadyRevoked();
    error VestingWalletERC20AlreadyRevoked(address token);

    address private immutable _revoker;
    uint64 private _etherRevocationTimestamp;
    uint256 private _etherAllocationAtRevocation;
    mapping(address token => uint64) private _erc20RevocationTimestamp;
    mapping(address token => uint256) private _erc20AllocationAtRevocation;

    constructor(
        address beneficiary,
        address revoker_,
        uint64 startTimestamp,
        uint64 durationSeconds
    ) payable VestingWallet(beneficiary, startTimestamp, durationSeconds) {
        if (revoker_ == address(0)) {
            revert VestingWalletInvalidRevoker(address(0));
        }
        _revoker = revoker_;
    }

    modifier onlyRevoker() {
        if (_msgSender() != revoker()) {
            revert VestingWalletUnauthorizedRevoker(_msgSender());
        }
        _;
    }

    /**
     * @dev Getter for the address allowed to revoke vesting.
     */
    function revoker() public view virtual returns (address) {
        return _revoker;
    }

    /**
     * @dev Returns true if the native asset vesting has been revoked.
     */
    function revoked() public view virtual returns (bool) {
        return _etherRevocationTimestamp != 0;
    }

    /**
     * @dev Returns true if the vesting of `token` has been revoked.
     */
    function revoked(address token) public view virtual returns (bool) {
        return _erc20RevocationTimestamp[token] != 0;
    }

    /**
     * @dev Revokes the native asset vesting, returning the unvested amount to the revoker.
     *
     * Emits an {EtherRevoked} event.
     */
    function revoke() public virtual onlyRevoker {
        if (revoked()) {
            revert VestingWalletEtherAlreadyRevoked();
        }

        uint64 timestamp = uint64(block.timestamp);
        uint256 totalAllocation = address(this).balance + released();
        uint256 vested = _vestingSchedule(totalAllocation, timestamp);
        uint256 refund = totalAllocation - vested;

        _etherRevocationTimestamp = timestamp;
        _etherAllocationAtRevocation = totalAllocation;

        emit EtherRevoked(refund);
        Address.sendValue(payable(revoker()), refund);
    }

    /**
     * @dev Revokes the vesting of `token`, returning the unvested amount to the revoker.
     *
     * Emits an {ERC20Revoked} event.
     */
    function revoke(address token) public virtual onlyRevoker {
        if (revoked(token)) {
            revert VestingWalletERC20AlreadyRevoked(token);
        }

        uint64 timestamp = uint64(block.timestamp);
        uint256 totalAllocation = IERC20(token).balanceOf(address(this)) + released(token);
        uint256 vested = _vestingSchedule(totalAllocation, timestamp);
        uint256 refund = totalAllocation - vested;

        _erc20RevocationTimestamp[token] = timestamp;
        _erc20AllocationAtRevocation[token] = totalAllocation;

        emit ERC20Revoked(token, refund);
        SafeERC20.safeTransfer(IERC20(token), revoker(), refund);
    }

    /**
     * @dev Calculates the amount of ether that has already vested. Once revoked, the native asset vesting is frozen at
     * the revocation timestamp and keeps using the historical allocation that existed at revocation time.
     */
    function vestedAmount(uint64 timestamp) public view virtual override returns (uint256) {
        uint64 revocationTimestamp = _etherRevocationTimestamp;
        if (revocationTimestamp == 0) {
            return super.vestedAmount(timestamp);
        }

        return _vestingSchedule(_etherAllocationAtRevocation, _min(timestamp, revocationTimestamp));
    }

    /**
     * @dev Calculates the amount of tokens that have already vested. Once revoked, the token vesting is frozen at the
     * revocation timestamp and keeps using the historical allocation that existed at revocation time.
     */
    function vestedAmount(address token, uint64 timestamp) public view virtual override returns (uint256) {
        uint64 revocationTimestamp = _erc20RevocationTimestamp[token];
        if (revocationTimestamp == 0) {
            return super.vestedAmount(token, timestamp);
        }

        return _vestingSchedule(_erc20AllocationAtRevocation[token], _min(timestamp, revocationTimestamp));
    }

    function _min(uint64 a, uint64 b) private pure returns (uint64) {
        return a < b ? a : b;
    }
}
