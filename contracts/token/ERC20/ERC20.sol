// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.20;

import {IERC20} from "./IERC20.sol";
import {IERC20Metadata} from "./extensions/IERC20Metadata.sol";
import {Context} from "../../utils/Context.sol";
import {IERC20Errors} from "../../interfaces/draft-IERC6093.sol";
import {IERC8255} from "../../interfaces/draft-IERC8255.sol";

type ERC20Allowance is uint256;

/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.openzeppelin.com/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * The default value of {decimals} is 18. To change this, you should override
 * this function so it returns a different value.
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC-20
 * applications.
 */
abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors, IERC8255 {
    mapping(address account => uint256) private _balances;

    mapping(address account => mapping(address spender => ERC20Allowance)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    uint256 private constant ALLOWANCE_VALUE_MASK = type(uint192).max;
    uint256 private constant ALLOWANCE_MAX_VALUE_SENTINEL = ALLOWANCE_VALUE_MASK;

    /**
     * @dev The requested approval duration exceeds {maxApprovalDuration}.
     */
    error ERC8255InvalidApprovalDuration(uint32 duration, uint32 maxDuration);

    /**
     * @dev The requested approval value cannot be represented in packed allowance storage.
     */
    error ERC8255InvalidApprovalValue(uint256 value);

    /**
     * @dev The computed approval expiration cannot be represented as a `uint64`.
     */
    error ERC8255InvalidApprovalExpiration(uint256 expiration);

    /**
     * @dev The approval is expired.
     */
    error ERC8255ExpiredApproval(address spender, uint64 expiration);

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * Both values are immutable: they can only be set once during construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the default value returned by this function, unless
     * it's overridden.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    /// @inheritdoc IERC20
    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    /// @inheritdoc IERC20
    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `value`.
     */
    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    /// @inheritdoc IERC20
    function allowance(address owner, address spender) public view virtual returns (uint256) {
        (uint64 expiration, uint256 value) = allowanceAndExpiration(owner, spender);
        if (_isExpired(expiration)) {
            return 0;
        }
        return value;
    }

    /// @inheritdoc IERC8255
    function maxApprovalDuration() public pure virtual returns (uint32) {
        return type(uint32).max;
    }

    /// @inheritdoc IERC8255
    function allowanceAndExpiration(
        address owner,
        address spender
    ) public view virtual returns (uint64 expiration, uint256 value) {
        return _unpackAllowance(_allowances[owner][spender]);
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `value` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 value) public virtual returns (bool) {
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
     * @dev See {IERC20-transferFrom}.
     *
     * Skips emitting an {Approval} event indicating an allowance update. This is not
     * required by the ERC. See {xref-ERC20-_approve-address-address-uint256-bool-}[_approve].
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `value`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `value`.
     */
    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            // Overflow check required: The rest of the code assumes that totalSupply never overflows
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                // Overflow not possible: value <= fromBalance <= totalSupply.
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                // Overflow not possible: value <= totalSupply or value <= fromBalance <= totalSupply.
                _totalSupply -= value;
            }
        } else {
            unchecked {
                // Overflow not possible: balance + value is at most totalSupply, which we know fits into a uint256.
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    /**
     * @dev Creates a `value` amount of tokens and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    /**
     * @dev Destroys a `value` amount of tokens from `account`, lowering the total supply.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     *
     * Overrides to this logic should be done to the variant with an additional `bool emitEvent` argument.
     */
    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    /**
     * @dev Sets `value` as the allowance of `spender` over the `owner`'s tokens until `duration` seconds from now.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     * - `duration` cannot exceed {maxApprovalDuration}.
     */
    function _approve(address owner, address spender, uint256 value, uint32 duration) internal {
        _approve(owner, spender, value, duration, true);
    }

    /**
     * @dev Variant of {_approve} with an optional flag to enable or disable the {Approval} event.
     *
     * By default (when calling {_approve}) the flag is set to true and the approval expiration is set to
     * `block.timestamp + maxApprovalDuration()`. On the other hand, approval changes made by `_spendAllowance` during
     * the `transferFrom` operation set the flag to false and preserve the approval expiration. This saves gas by not
     * emitting any `Approval` event during `transferFrom` operations.
     *
     * Anyone who wishes to continue emitting `Approval` events on the `transferFrom` operation can force the flag to
     * true using the following override:
     *
     * ```solidity
     * function _approve(address owner, address spender, uint256 value, bool) internal virtual override {
     *     super._approve(owner, spender, value, true);
     * }
     * ```
     *
     * Requirements are the same as {_approve}.
     */
    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        _approve(owner, spender, value, maxApprovalDuration(), emitEvent);
    }

    /**
     * @dev Variant of {_approve} with an approval duration and an optional flag to enable or disable the {Approval}
     * event.
     */
    function _approve(address owner, address spender, uint256 value, uint32 duration, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        uint32 maxDuration = maxApprovalDuration();
        if (duration > maxDuration) {
            revert ERC8255InvalidApprovalDuration(duration, maxDuration);
        }

        _allowances[owner][spender] = _packAllowance(_expiration(value, duration), value);
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `value`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        (uint64 expiration, uint256 currentAllowance) = allowanceAndExpiration(owner, spender);
        if (currentAllowance < value) {
            revert ERC20InsufficientAllowance(spender, currentAllowance, value);
        }
        if (value > 0 && _isExpired(expiration)) {
            revert ERC8255ExpiredApproval(spender, expiration);
        }
        if (currentAllowance < type(uint256).max) {
            unchecked {
                uint256 updatedAllowance = currentAllowance - value;
                _approve(owner, spender, updatedAllowance, false);
                if (updatedAllowance != 0) {
                    _allowances[owner][spender] = _packAllowance(expiration, updatedAllowance);
                }
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
    function _expiration(uint256 value, uint32 duration) private view returns (uint64) {
        if (value == 0) {
            return 0;
        }

        uint256 expiration = block.timestamp + duration;
        if (expiration > type(uint64).max) {
            revert ERC8255InvalidApprovalExpiration(expiration);
        }
        return uint64(expiration);
    }

    /**
     * @dev Packs an approval expiration and value into an {ERC20Allowance}.
     */
    function _packAllowance(uint64 expiration, uint256 value) private pure returns (ERC20Allowance) {
        if (value == 0) {
            return ERC20Allowance.wrap(0);
        }
        if (value != type(uint256).max && value >= ALLOWANCE_MAX_VALUE_SENTINEL) {
            revert ERC8255InvalidApprovalValue(value);
        }
        uint256 storedValue = value == type(uint256).max ? ALLOWANCE_MAX_VALUE_SENTINEL : value;
        return ERC20Allowance.wrap((uint256(expiration) << 192) | storedValue);
    }

    /**
     * @dev Unpacks an {ERC20Allowance} into an approval expiration and value.
     */
    function _unpackAllowance(ERC20Allowance allowance_) private pure returns (uint64 expiration, uint256 value) {
        uint256 packed = ERC20Allowance.unwrap(allowance_);
        expiration = uint64(packed >> 192);
        value = packed & ALLOWANCE_VALUE_MASK;
        if (value == ALLOWANCE_MAX_VALUE_SENTINEL) {
            value = type(uint256).max;
        }
    }
}
