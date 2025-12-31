// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {ERC20} from "../ERC20.sol";
import {IERC7246} from "../../../interfaces/draft-IERC7246.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @title ERC7246
 * @dev An extension of {ERC20} that adds support for encumbrances of token balances. Encumbrances are a
 * stronger version of allowances: they grant the `spender` an exclusive right to transfer tokens from the
 * `owner`'s balance without reducing the `owner`'s balance until the tokens are transferred or the
 * encumbrance is released.
 */
abstract contract ERC7246 is ERC20, IERC7246 {
    /// @dev Thrown when the result of an {_update} or {_encumber} call would result in negative {availableBalanceOf}.
    error ERC7246InsufficientAvailableBalance(uint256 available, uint256 required);

    /// @dev Thrown when an account tries to release more encumbered tokens than it has.
    error ERC7246InsufficientEncumbrance(uint256 encumbered, uint256 required);

    /// @dev Thrown when an account tries to encumber tokens to itself.
    error ERC7246SelfEncumbrance();

    mapping(address owner => mapping(address spender => uint256)) private _encumbrances;
    mapping(address owner => uint256) private _encumberedBalances;

    /// @inheritdoc IERC7246
    function encumberedBalanceOf(address owner) public view virtual returns (uint256) {
        return _encumberedBalances[owner];
    }

    /// @inheritdoc IERC7246
    function availableBalanceOf(address owner) public view virtual returns (uint256) {
        return balanceOf(owner) - encumberedBalanceOf(owner);
    }

    /// @inheritdoc IERC7246
    function encumbrances(address owner, address spender) public view virtual returns (uint256) {
        return _encumbrances[owner][spender];
    }

    /// @inheritdoc IERC7246
    function encumber(address spender, uint256 amount) public virtual {
        _encumber(msg.sender, spender, amount);
    }

    /// @inheritdoc IERC7246
    function encumberFrom(address owner, address spender, uint256 amount) public virtual {
        _spendAllowance(owner, msg.sender, amount);
        _encumber(owner, spender, amount);
    }

    /// @inheritdoc IERC7246
    function release(address owner, uint256 amount) public virtual {
        _releaseEncumbrance(owner, msg.sender, amount);
    }

    /**
     * @dev Encumber `amount` of tokens from `owner` to `spender`. Encumbering tokens grants an exclusive right
     * to transfer the tokens without removing them from `owner`'s balance. Release the tokens by calling
     * {release} or transfer them by calling {transferFrom}.
     */
    function _encumber(address owner, address spender, uint256 amount) internal virtual {
        require(owner != spender, ERC7246SelfEncumbrance());
        uint256 availableBalance = availableBalanceOf(owner);
        require(availableBalance >= amount, ERC7246InsufficientAvailableBalance(availableBalance, amount));

        // Given that the `availableBalanceOf` is `balanceOf(owner) - encumberedBalanceOf(owner)`,
        // we know that the new `_encumberedBalances[owner] <= balanceOf(owner)` and thus no overflow is possible.
        // `_encumberedBalances[owner] >= _encumbrances[owner][spender]`, so no overflow is possible there either.
        unchecked {
            _encumbrances[owner][spender] += amount;
            _encumberedBalances[owner] += amount;
        }

        emit Encumber(owner, spender, amount);
    }

    /**
     * @dev Release `amount` of encumbered tokens from `owner` to `spender`.
     *
     * - Will revert if there are insufficient encumbered tokens.
     * - Emits the {IERC7246-Release} event.
     */
    function _releaseEncumbrance(address owner, address spender, uint256 amount) internal virtual {
        uint256 encumbered = encumbrances(owner, spender);
        require(encumbered >= amount, ERC7246InsufficientEncumbrance(encumbered, amount));

        unchecked {
            _encumbrances[owner][spender] -= amount;
            _encumberedBalances[owner] -= amount;
        }

        emit Release(owner, spender, amount);
    }

    /**
     * @dev See {ERC20-_spendAllowance}. Encumbrances are consumed first, then the remaining amount
     * is passed to `super._spendAllowance`.
     */
    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual override {
        uint256 amountEncumbered = encumbrances(owner, spender);
        uint256 remainingAllowance = amount;

        if (amountEncumbered != 0) {
            uint256 encumberedToUse = Math.min(amount, amountEncumbered);
            _releaseEncumbrance(owner, spender, encumberedToUse);
            unchecked {
                remainingAllowance -= encumberedToUse;
            }
        }

        super._spendAllowance(owner, spender, remainingAllowance);
    }

    /// @dev See {ERC20-_update}. Ensures that `from` has sufficient {availableBalanceOf} to cover the `amount` being transferred.
    function _update(address from, address to, uint256 amount) internal virtual override {
        // TODO: Open question: should we keep the same revert message for normal insufficient balance? If so call super first.
        // Would require some changes in the calculations to work properly (update changes balance)
        if (from != address(0)) {
            uint256 availableBalance = availableBalanceOf(from);
            require(availableBalance >= amount, ERC7246InsufficientAvailableBalance(availableBalance, amount));
        }
        super._update(from, to, amount);
    }
}
