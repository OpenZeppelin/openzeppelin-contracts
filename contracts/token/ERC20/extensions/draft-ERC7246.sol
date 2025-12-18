// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";
import {IERC7246} from "../../../interfaces/draft-IERC7246.sol";
import {Math} from "../../../utils/math/Math.sol";

abstract contract ERC7246 is ERC20, IERC7246 {
    error ERC7246InsufficientAvailableBalance(uint256 available, uint256 required);
    error ERC7246InsufficientEncumbrance(uint256 encumbered, uint256 required);

    mapping(address owner => mapping(address spender => uint256)) private _encumbrances;
    mapping(address owner => uint256) private _encumberedBalances;

    /// @inheritdoc IERC7246
    function encumberedBalanceOf(address owner) public view returns (uint256) {
        return _encumberedBalances[owner];
    }

    /// @inheritdoc IERC7246
    function availableBalanceOf(address owner) public view returns (uint256) {
        return balanceOf(owner) - encumberedBalanceOf(owner);
    }

    /// @inheritdoc IERC7246
    function encumbrances(address owner, address spender) public view returns (uint256) {
        return _encumbrances[owner][spender];
    }

    /// @inheritdoc IERC7246
    function encumber(address spender, uint256 amount) public {
        _encumber(msg.sender, spender, amount);
    }

    /// @inheritdoc IERC7246
    function encumberFrom(address owner, address spender, uint256 amount) public {
        _spendAllowance(owner, msg.sender, amount);
        _encumber(owner, spender, amount);
    }

    /// @inheritdoc IERC7246
    function release(address owner, uint256 amount) public {
        uint256 encumbered = encumbrances(owner, msg.sender);
        require(encumbered >= amount, ERC7246InsufficientEncumbrance(encumbered, amount));

        unchecked {
            _encumbrances[owner][msg.sender] -= amount;
            _encumberedBalances[owner] -= amount;
        }

        emit Release(owner, msg.sender, amount);
    }

    function _encumber(address owner, address spender, uint256 amount) internal virtual {
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

    /// @inheritdoc ERC20
    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual override {
        uint256 amountEncumbered = encumbrances(owner, spender);
        uint256 remainingAllowance = amount;

        if (amountEncumbered != 0) {
            uint256 encumberedToUse = Math.min(amount, amountEncumbered);
            unchecked {
                _encumbrances[owner][spender] -= encumberedToUse;
                _encumberedBalances[owner] -= encumberedToUse;
                remainingAllowance -= encumberedToUse;
            }
        }

        super._spendAllowance(owner, spender, remainingAllowance);
    }

    /// @inheritdoc ERC20
    function _update(address from, address to, uint256 amount) internal virtual override {
        uint256 availableBalance = availableBalanceOf(from);
        require(availableBalance >= amount, ERC7246InsufficientAvailableBalance(availableBalance, amount));
        super._update(from, to, amount);
    }
}
