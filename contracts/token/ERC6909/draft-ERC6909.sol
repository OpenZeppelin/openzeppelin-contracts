// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC6909} from "../../interfaces/draft-IERC6909.sol";
import {Context} from "../../utils/Context.sol";
import {IERC165, ERC165} from "../../utils/introspection/ERC165.sol";

contract ERC6909 is Context, ERC165, IERC6909 {
    error ERC6909InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 id);
    error ERC6909InsufficientAllowance(address spender, uint256 allowance, uint256 needed, uint256 id);
    error ERC6909InvalidReceiver(address receiver);
    error ERC6909InvalidSender(address sender);

    mapping(uint256 id => mapping(address owner => uint256)) private _balances;

    mapping(address owner => mapping(address operator => bool)) private _operatorApprovals;

    mapping(address owner => mapping(address spender => mapping(uint256 id => uint256))) private _allowances;

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC6909).interfaceId || super.supportsInterface(interfaceId);
    }

    function balanceOf(address owner, uint256 id) public view virtual override returns (uint256) {
        return _balances[id][owner];
    }

    function allowance(address owner, address spender, uint256 id) public view virtual override returns (uint256) {
        return _allowances[owner][spender][id];
    }

    function isOperator(address owner, address spender) public view virtual override returns (bool) {
        return _operatorApprovals[owner][spender];
    }

    function approve(address spender, uint256 id, uint256 amount) external virtual override returns (bool) {
        address caller = _msgSender();
        _allowances[caller][spender][id] = amount;

        emit Approval(caller, spender, id, amount);
        return true;
    }

    function setOperator(address spender, bool approved) external virtual override returns (bool) {
        address caller = _msgSender();
        _operatorApprovals[caller][spender] = approved;

        emit OperatorSet(caller, spender, approved);
        return true;
    }

    function transfer(address receiver, uint256 id, uint256 amount) external virtual override returns (bool) {
        _transfer(_msgSender(), receiver, id, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address receiver,
        uint256 id,
        uint256 amount
    ) external virtual override returns (bool) {
        address caller = _msgSender();
        if (caller != sender && !isOperator(sender, caller)) {
            uint256 currentAllowance = allowance(sender, caller, id);
            if (currentAllowance != type(uint256).max) {
                if (currentAllowance < amount) {
                    revert ERC6909InsufficientAllowance(caller, currentAllowance, amount, id);
                }
                unchecked {
                    _allowances[sender][caller][id] = currentAllowance - amount;
                }
            }
        }

        _transfer(sender, receiver, id, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 id, uint256 amount) internal {
        if (from == address(0)) {
            revert ERC6909InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC6909InvalidReceiver(address(0));
        }
        _update(from, to, id, amount);
    }

    function _update(address from, address to, uint256 id, uint256 amount) internal virtual {
        address caller = _msgSender();

        if (from != address(0)) {
            uint256 fromBalance = balanceOf(from, id);
            if (fromBalance < amount) {
                revert ERC6909InsufficientBalance(from, fromBalance, amount, id);
            }
            unchecked {
                _balances[id][from] -= amount;
            }
        }
        if (to != address(0)) {
            _balances[id][to] += amount;
        }

        emit Transfer(caller, from, to, id, amount);
    }

    function _mint(address to, uint256 id, uint256 amount) internal {
        if (to == address(0)) {
            revert ERC6909InvalidReceiver(address(0));
        }
        _update(address(0), to, id, amount);
    }

    function _burn(address from, uint256 id, uint256 amount) internal {
        if (from == address(0)) {
            revert ERC6909InvalidSender(address(0));
        }
        _update(from, address(0), id, amount);
    }
}
