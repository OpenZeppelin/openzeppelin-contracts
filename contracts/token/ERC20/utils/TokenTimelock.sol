// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC20/utils/TokenTimelock.sol)

pragma solidity ^0.8.19;

import "./SafeERC20.sol";

/**
 * @dev A token holder contract that will allow a beneficiary to extract the
 * tokens after a given release time.
 *
 * Useful for simple vesting schedules like "advisors get all of their tokens
 * after 1 year".
 */
contract TokenTimelock {
    using SafeERC20 for IERC20;

    // ERC20 basic token contract being held
    IERC20 private immutable _token;

    // beneficiary of tokens after they are released
    address private immutable _beneficiary;

    // timestamp when token release is enabled
    uint256 private immutable _releaseTime;

    /**
     * @dev The release time has already passed.
     */
    error TokenTimelockPastRelease(uint256 release);

    /**
     * @dev The release time has not yet passed.
     */
    error TokenTimelockFutureRelease(uint256 release);

    /**
     * @dev There are no tokens to release.
     */
    error TokenTimelockEmptyBalance();

    /**
     * @dev Deploys a timelock instance that is able to hold the token specified, and will only release it to
     * `beneficiary_` when {release} is invoked after `releaseTime_`. The release time is specified as a Unix timestamp
     * (in seconds).
     */
    constructor(IERC20 token_, address beneficiary_, uint256 releaseTime_) {
        if (releaseTime_ <= block.timestamp) revert TokenTimelockPastRelease(releaseTime_);
        _token = token_;
        _beneficiary = beneficiary_;
        _releaseTime = releaseTime_;
    }

    /**
     * @dev Returns the token being held.
     */
    function token() public view virtual returns (IERC20) {
        return _token;
    }

    /**
     * @dev Returns the beneficiary that will receive the tokens.
     */
    function beneficiary() public view virtual returns (address) {
        return _beneficiary;
    }

    /**
     * @dev Returns the time when the tokens are released in seconds since Unix epoch (i.e. Unix timestamp).
     */
    function releaseTime() public view virtual returns (uint256) {
        return _releaseTime;
    }

    /**
     * @dev Transfers tokens held by the timelock to the beneficiary. Will only succeed if invoked after the release
     * time.
     */
    function release() public virtual {
        uint256 time = releaseTime();
        if (block.timestamp < time) {
            revert TokenTimelockFutureRelease(time);
        }

        uint256 amount = token().balanceOf(address(this));
        if (amount == 0) {
            revert TokenTimelockEmptyBalance();
        }

        token().safeTransfer(beneficiary(), amount);
    }
}
