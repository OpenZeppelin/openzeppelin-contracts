// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.6.1) (token/ERC20/extensions/draft-ERC20ExpiringApproval.sol)

pragma solidity ^0.8.20;

import {IERC20, ERC20} from "../ERC20.sol";
import {IERC8255} from "../../../interfaces/draft-IERC8255.sol";

/**
 * @dev Extension of {ERC20} that adds support for expiring approvals following ERC-8255.
 *
 * WARNING: This is a draft contract. The corresponding ERC is still subject to changes.
 */
abstract contract ERC20ExpiringApproval is ERC20, IERC8255 {
    mapping(address owner => mapping(address spender => uint64)) private _allowanceExpirations;

    /**
     * @dev The requested approval duration exceeds {maxApprovalDuration}.
     */
    error ERC8255InvalidApprovalDuration(uint32 duration, uint32 maxDuration);

    /**
     * @dev The computed approval expiration cannot be represented as a `uint64`.
     */
    error ERC8255InvalidApprovalExpiration(uint256 expiration);

    /**
     * @dev The approval is expired.
     */
    error ERC8255ExpiredApproval(address spender, uint64 expiration);

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual override(IERC20, ERC20) returns (uint256) {
        (uint64 expiration, uint256 value) = allowanceAndExpiration(owner, spender);
        if (_isExpired(expiration)) {
            return 0;
        }
        return value;
    }

    /**
     * @inheritdoc IERC8255
     * @dev The default maximum approval duration is 1 hour. Override this function to use a different limit.
     */
    function maxApprovalDuration() public pure virtual returns (uint32) {
        return 1 hours;
    }

    /// @inheritdoc IERC8255
    function allowanceAndExpiration(
        address owner,
        address spender
    ) public view virtual returns (uint64 expiration, uint256 value) {
        return _allowanceAndExpiration(owner, spender);
    }

    /**
     * @dev Returns the approval expiration timestamp and allowance for `spender` over `owner` tokens.
     */
    function _allowanceAndExpiration(
        address owner,
        address spender
    ) internal view virtual returns (uint64 expiration, uint256 value) {
        expiration = _allowanceExpirations[owner][spender];
        value = super.allowance(owner, spender);
        if (value > 0 && _isLegacyCompatibleSpender(spender)) {
            expiration = uint64(block.timestamp);
        }
    }

    /**
     * @dev Returns whether `spender` should be treated as a legacy-compatible spender.
     *
     * Legacy-compatible spenders are allowed to use approvals after their stored expiration. Derived contracts may
     * override this function to implement their own designation mechanism. Spenders are not legacy-compatible by
     * default.
     */
    function _isLegacyCompatibleSpender(address) internal view virtual returns (bool) {
        return false;
    }

    /// @inheritdoc IERC20
    function approve(address spender, uint256 value) public virtual override(IERC20, ERC20) returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    /// @inheritdoc IERC8255
    function approveForDuration(address spender, uint256 value, uint32 duration) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value, duration);
        return true;
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens until `duration` seconds from now.
     *
     * This internal function is equivalent to `approveForDuration`, and can be used to e.g. set automatic allowances
     * for certain subsystems, etc.
     *
     * Emits an {Approval} event and an {IERC8255-ApprovalExpiration} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     * - `duration` cannot exceed {maxApprovalDuration}.
     */
    function _approve(address owner, address spender, uint256 value, uint32 duration) internal {
        _approve(owner, spender, value, _expiration(value, duration), true);
    }

    /**
     * @dev Variant of {_approve} that sets the approval expiration to `block.timestamp + maxApprovalDuration()`.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual override {
        _approve(owner, spender, value, _expiration(value, maxApprovalDuration()), emitEvent);
    }

    /**
     * @dev Variant of {_approve} with an approval expiration and an optional flag to enable or disable the {Approval}
     * and {IERC8255-ApprovalExpiration} events. This is used by {_spendAllowance} to preserve the original
     * expiration.
     */
    function _approve(
        address owner,
        address spender,
        uint256 value,
        uint64 expiration,
        bool emitEvent
    ) internal virtual {
        super._approve(owner, spender, value, emitEvent);
        _allowanceExpirations[owner][spender] = expiration;
        if (emitEvent) {
            emit ApprovalExpiration(owner, spender, expiration);
        }
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `value`, preserving the approval expiration.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available or if the approval is expired.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual override {
        (uint64 expiration, uint256 currentAllowance) = _allowanceAndExpiration(owner, spender);
        if (currentAllowance < value) {
            revert ERC20InsufficientAllowance(spender, currentAllowance, value);
        }
        if (value > 0 && _isExpired(expiration)) {
            revert ERC8255ExpiredApproval(spender, expiration);
        }
        if (currentAllowance < type(uint256).max) {
            unchecked {
                uint256 updatedAllowance = currentAllowance - value;
                uint64 storedExpiration = _allowanceExpirations[owner][spender];
                _approve(owner, spender, updatedAllowance, updatedAllowance == 0 ? 0 : storedExpiration, false);
            }
        }
    }

    /**
     * @dev Returns whether an approval expiration is in the past.
     */
    function _isExpired(uint64 expiration) private view returns (bool) {
        return expiration < block.timestamp;
    }

    /**
     * @dev Returns an absolute expiration timestamp for an approval created with `duration`.
     */
    function _expiration(uint256 value, uint32 duration) internal view returns (uint64) {
        uint32 maxDuration = maxApprovalDuration();
        if (duration > maxDuration) {
            revert ERC8255InvalidApprovalDuration(duration, maxDuration);
        }
        return _expiration(value, duration, block.timestamp);
    }

    /**
     * @dev Returns an absolute expiration timestamp for an approval created with `duration` at `timestamp`.
     */
    function _expiration(uint256 value, uint32 duration, uint256 timestamp) internal pure returns (uint64) {
        if (value == 0) {
            return 0;
        }

        uint256 expiration = timestamp + duration;
        if (expiration > type(uint64).max) {
            revert ERC8255InvalidApprovalExpiration(expiration);
        }
        return uint64(expiration);
    }
}
