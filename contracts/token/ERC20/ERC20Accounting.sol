// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC20/ERC20.sol)

pragma solidity ^0.8.0;

import "./IERC20.sol";
import "./extensions/IERC20Metadata.sol";
import "../../utils/Context.sol";

library ERC20Accounting {
    struct Data {
        mapping(address => uint256) _balances;
        mapping(address => mapping(address => uint256)) _allowances;
        uint256 _totalSupply;
    }

    function totalSupply(Data storage self) internal view returns (uint256) {
        return self._totalSupply;
    }

    function balanceOf(Data storage self, address account) internal view returns (uint256) {
        return self._balances[account];
    }

    function transfer(
        Data storage self,
        address msgSender,
        address recipient,
        uint256 amount,
        function(address,address,uint256) internal _beforeTokenTransfer,
        function(address,address,uint256) internal _afterTokenTransfer
    ) internal returns (bool) {
        _transfer(self, msgSender, recipient, amount, _beforeTokenTransfer, _afterTokenTransfer);
        return true;
    }

    function allowance(Data storage self, address owner, address spender) internal view returns (uint256) {
        return self._allowances[owner][spender];
    }

    function approve(
        Data storage self,
        address msgSender,
        address spender,
        uint256 amount,
        function(address,address,uint256) internal _beforeTokenApproval,
        function(address,address,uint256) internal _afterTokenApproval
    ) internal returns (bool) {
        _approve(self, msgSender, spender, amount, _beforeTokenApproval, _afterTokenApproval);
        return true;
    }

    function transferFrom(
        Data storage self,
        address msgSender,
        address sender,
        address recipient,
        uint256 amount,
        function(address,address,uint256) internal _beforeTokenTransfer,
        function(address,address,uint256) internal _afterTokenTransfer,
        function(address,address,uint256) internal _beforeTokenApproval,
        function(address,address,uint256) internal _afterTokenApproval
    ) internal returns (bool) {
        _transfer(self, sender, recipient, amount, _beforeTokenTransfer, _afterTokenTransfer);

        uint256 currentAllowance = self._allowances[sender][msgSender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(self, sender, msgSender, currentAllowance - amount, _beforeTokenApproval, _afterTokenApproval);
        }

        return true;
    }

    function increaseAllowance(
        Data storage self,
        address msgSender,
        address spender,
        uint256 addedValue,
        function(address,address,uint256) internal _beforeTokenApproval,
        function(address,address,uint256) internal _afterTokenApproval
    ) internal returns (bool) {
        _approve(self, msgSender, spender, self._allowances[msgSender][spender] + addedValue, _beforeTokenApproval, _afterTokenApproval);
        return true;
    }

    function decreaseAllowance(
        Data storage self,
        address msgSender,
        address spender,
        uint256 subtractedValue,
        function(address,address,uint256) internal _beforeTokenApproval,
        function(address,address,uint256) internal _afterTokenApproval
    ) internal returns (bool) {
        uint256 currentAllowance = self._allowances[msgSender][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(self, msgSender, spender, currentAllowance - subtractedValue, _beforeTokenApproval, _afterTokenApproval);
        }

        return true;
    }

    function _transfer(
        Data storage self,
        address sender,
        address recipient,
        uint256 amount,
        function(address,address,uint256) internal _beforeTokenTransfer,
        function(address,address,uint256) internal _afterTokenTransfer
    ) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(sender, recipient, amount);

        uint256 senderBalance = self._balances[sender];
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            self._balances[sender] = senderBalance - amount;
        }
        self._balances[recipient] += amount;

        _afterTokenTransfer(sender, recipient, amount);
    }

    function _mint(
        Data storage self,
        address account,
        uint256 amount,
        function(address,address,uint256) internal _beforeTokenTransfer,
        function(address,address,uint256) internal _afterTokenTransfer
    ) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        self._totalSupply += amount;
        self._balances[account] += amount;

        _afterTokenTransfer(address(0), account, amount);
    }

    function _burn(
        Data storage self,
        address account,
        uint256 amount,
        function(address,address,uint256) internal _beforeTokenTransfer,
        function(address,address,uint256) internal _afterTokenTransfer
    ) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        uint256 accountBalance = self._balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            self._balances[account] = accountBalance - amount;
        }
        self._totalSupply -= amount;

        _afterTokenTransfer(account, address(0), amount);
    }

    function _approve(
        Data storage self,
        address owner,
        address spender,
        uint256 amount,
        function(address,address,uint256) internal _beforeTokenApproval,
        function(address,address,uint256) internal _afterTokenApproval
    ) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _beforeTokenApproval(owner, spender, amount);

        self._allowances[owner][spender] = amount;

        _afterTokenApproval(owner, spender, amount);
    }
}
