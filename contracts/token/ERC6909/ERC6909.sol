// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (token/ERC6909/ERC6909.sol)

pragma solidity ^0.8.20;

import {IERC6909} from "../../interfaces/IERC6909.sol";
import {Context} from "../../utils/Context.sol";
import {IERC165, ERC165} from "../../utils/introspection/ERC165.sol";

/**
 * @dev Implementation of ERC-6909.
 * See https://eips.ethereum.org/EIPS/eip-6909
 */
contract ERC6909 is Context, ERC165, IERC6909 {
    mapping(address owner => mapping(uint256 id => uint256)) private _balances;

    mapping(address owner => mapping(address operator => bool)) private _operatorApprovals;

    mapping(address owner => mapping(address spender => mapping(uint256 id => uint256))) private _allowances;

    error ERC6909InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 id);
    error ERC6909InsufficientAllowance(address spender, uint256 allowance, uint256 needed, uint256 id);
    error ERC6909InvalidApprover(address approver);
    error ERC6909InvalidReceiver(address receiver);
    error ERC6909InvalidSender(address sender);
    error ERC6909InvalidSpender(address spender);

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC6909).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IERC6909
    function balanceOf(address owner, uint256 id) public view virtual override returns (uint256) {
        return _balances[owner][id];
    }

    /// @inheritdoc IERC6909
    function allowance(address owner, address spender, uint256 id) public view virtual override returns (uint256) {
        return _allowances[owner][spender][id];
    }

    /// @inheritdoc IERC6909
    function isOperator(address owner, address spender) public view virtual override returns (bool) {
        return _operatorApprovals[owner][spender];
    }

    /// @inheritdoc IERC6909
    function approve(address spender, uint256 id, uint256 amount) public virtual override returns (bool) {
        _approve(_msgSender(), spender, id, amount);
        return true;
    }

    /// @inheritdoc IERC6909
    function setOperator(address spender, bool approved) public virtual override returns (bool) {
        _setOperator(_msgSender(), spender, approved);
        return true;
    }

    /// @inheritdoc IERC6909
    function transfer(address receiver, uint256 id, uint256 amount) public virtual override returns (bool) {
        _transfer(_msgSender(), receiver, id, amount);
        return true;
    }

    /// @inheritdoc IERC6909
    function transferFrom(
        address sender,
        address receiver,
        uint256 id,
        uint256 amount
    ) public virtual override returns (bool) {
        address caller = _msgSender();
        if (sender != caller && !isOperator(sender, caller)) {
            _spendAllowance(sender, caller, id, amount);
        }
        _transfer(sender, receiver, id, amount);
        return true;
    }

    /**
     * @dev Creates `amount` of token `id` and assigns them to `account`, by transferring it from address(0).
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _mint(address to, uint256 id, uint256 amount) internal {
        if (to == address(0)) {
            revert ERC6909InvalidReceiver(address(0));
        }
        _update(address(0), to, id, amount);
    }

    /**
     * @dev Moves `amount` of token `id` from `from` to `to` without checking for approvals. This function verifies
     * that neither the sender nor the receiver are address(0), which means it cannot mint or burn tokens.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead.
     */
    function _transfer(address from, address to, uint256 id, uint256 amount) internal {
        if (from == address(0)) {
            revert ERC6909InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC6909InvalidReceiver(address(0));
        }
        _update(from, to, id, amount);
    }

    /**
     * @dev Destroys a `amount` of token `id` from `account`.
     * Relies on the `_update` mechanism.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * NOTE: This function is not virtual, {_update} should be overridden instead
     */
    function _burn(address from, uint256 id, uint256 amount) internal {
        if (from == address(0)) {
            revert ERC6909InvalidSender(address(0));
        }
        _update(from, address(0), id, amount);
    }

    /**
     * @dev Transfers `amount` of token `id` from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. All customizations to transfers, mints, and burns should be done by overriding
     * this function.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 id, uint256 amount) internal virtual {
        address caller = _msgSender();

        if (from != address(0)) {
            uint256 fromBalance = _balances[from][id];
            if (fromBalance < amount) {
                revert ERC6909InsufficientBalance(from, fromBalance, amount, id);
            }
            unchecked {
                // Overflow not possible: amount <= fromBalance.
                _balances[from][id] = fromBalance - amount;
            }
        }
        if (to != address(0)) {
            _balances[to][id] += amount;
        }

        emit Transfer(caller, from, to, id, amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner`'s `id` tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to e.g. set automatic allowances for certain
     * subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(address owner, address spender, uint256 id, uint256 amount) internal virtual {
        if (owner == address(0)) {
            revert ERC6909InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC6909InvalidSpender(address(0));
        }
        _allowances[owner][spender][id] = amount;
        emit Approval(owner, spender, id, amount);
    }

    /**
     * @dev Approve `spender` to operate on all of `owner`'s tokens
     *
     * This internal function is equivalent to `setOperator`, and can be used to e.g. set automatic allowances for
     * certain subsystems, etc.
     *
     * Emits an {OperatorSet} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _setOperator(address owner, address spender, bool approved) internal virtual {
        if (owner == address(0)) {
            revert ERC6909InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC6909InvalidSpender(address(0));
        }
        _operatorApprovals[owner][spender] = approved;
        emit OperatorSet(owner, spender, approved);
    }

    /**
     * @dev Updates `owner`'s allowance for `spender` based on spent `amount`.
     *
     * Does not update the allowance value in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Does not emit an {Approval} event.
     */
    function _spendAllowance(address owner, address spender, uint256 id, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender, id);
        if (currentAllowance < type(uint256).max) {
            if (currentAllowance < amount) {
                revert ERC6909InsufficientAllowance(spender, currentAllowance, amount, id);
            }
            unchecked {
                _allowances[owner][spender][id] = currentAllowance - amount;
            }
        }
    }
}
