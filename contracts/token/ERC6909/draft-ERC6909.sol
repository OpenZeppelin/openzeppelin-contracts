// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (token/ERC6909/draft-ERC6909.sol)

pragma solidity ^0.8.20;

import {IERC6909} from "../../interfaces/draft-IERC6909.sol";
import {Context} from "../../utils/Context.sol";
import {IERC165, ERC165} from "../../utils/introspection/ERC165.sol";

contract ERC6909 is Context, ERC165, IERC6909 {
    mapping(uint256 id => mapping(address account => uint256)) private _balances;

    mapping(address account => mapping(address operator => bool)) private _operatorApprovals;

    // Used as the URI for all token types by relying on ID substitution, e.g. https://token-cdn-domain/{id}.json
    string private _uri;

    mapping(address account => mapping(address operator => mapping(uint256 => uint256))) private _allowances;

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC6909).interfaceId || super.supportsInterface(interfaceId);
    }

    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        return _balances[id][account];
    }

    function allowance(address owner, address spender, uint256 id) public view virtual override returns (uint256) {
        return _allowances[owner][spender][id];
    }

    function isOperator(address owner, address operator) public view virtual override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function approve(address spender, uint256 id, uint256 amount) external virtual override returns (bool) {
        _allowances[_msgSender()][spender][id] = amount;

        emit Approval(_msgSender(), spender, id, amount);

        return true;
    }

    function setOperator(address spender, bool approved) external virtual override returns (bool) {
        _operatorApprovals[_msgSender()][spender] = approved;

        emit OperatorSet(_msgSender(), spender, approved);

        return true;
    }

    function transfer(address to, uint256 id, uint256 amount) external virtual override returns (bool) {
        _update(_msgSender(), to, id, amount);

        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount
    ) external virtual override returns (bool) {
        address caller = _msgSender();
        if (caller != from && !isOperator(from, caller)) {
            if (_allowances[from][_msgSender()][id] != type(uint256).max) {
                _allowances[from][_msgSender()][id] -= amount;
            }
        }

        _update(from, to, id, amount);

        return true;
    }

    function _update(address from, address to, uint256 id, uint256 amount) internal virtual {
        address caller = _msgSender();

        if (from != address(0)) {
            _balances[id][from] -= amount;
        }
        if (to != address(0)) {
            _balances[id][to] += amount;
        }

        emit Transfer(caller, from, to, id, amount);
    }

    function _mint(address to, uint256 id, uint256 amount) internal {
        _update(address(0), to, id, amount);
    }

    function _burn(address from, uint256 id, uint256 amount) internal {
        _update(from, address(0), id, amount);
    }
}
