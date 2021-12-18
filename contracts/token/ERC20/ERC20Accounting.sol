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

    struct Callbacks {
        function(uint256) internal view returns (uint256) getTotalSupply;
        function(uint256) internal view returns (uint256) setTotalSupply;
        function(address,uint256) internal view returns (uint256) getBalance;
        function(address,uint256) internal view returns (uint256) setBalance;
        function(address,address,uint256) internal view returns (uint256) getAllowance;
        function(address,address,uint256) internal view returns (uint256) setAllowance;
        function(address,address,uint256) internal beforeTokenTransfer;
        function(address,address,uint256) internal afterTokenTransfer;
        function(address,address,uint256) internal beforeTokenApproval;
        function(address,address,uint256) internal afterTokenApproval;
    }

    function totalSupply(
        Data storage self,
        Callbacks memory cbs 
    ) internal view returns (uint256) {
        return cbs.getTotalSupply(self._totalSupply);
    }

    function balanceOf(
        Data storage self,
        address account,
        Callbacks memory cbs
    ) internal view returns (uint256) {
        return cbs.getBalance(account, self._balances[account]);
    }

    function transfer(
        Data storage self,
        address msgSender,
        address recipient,
        uint256 amount,
        Callbacks memory cbs
    ) internal returns (bool) {
        _transfer(self, msgSender, recipient, amount, cbs);
        return true;
    }

    function allowance(
        Data storage self,
        address owner,
        address spender,
        Callbacks memory cbs
    ) internal view returns (uint256) {
        return cbs.getAllowance(owner, spender, self._allowances[owner][spender]);
    }

    function approve(
        Data storage self,
        address msgSender,
        address spender,
        uint256 amount,
        Callbacks memory cbs
    ) internal returns (bool) {
        _approve(self, msgSender, spender, amount, cbs);
        return true;
    }

    function transferFrom(
        Data storage self,
        address msgSender,
        address sender,
        address recipient,
        uint256 amount,
        Callbacks memory cbs
    ) internal returns (bool) {
        _transfer(self, sender, recipient, amount, cbs);

        uint256 currentAllowance = cbs.getAllowance(sender, msgSender, self._allowances[sender][msgSender]);
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(self, sender, msgSender, currentAllowance - amount, cbs);
        }

        return true;
    }

    function increaseAllowance(
        Data storage self,
        address msgSender,
        address spender,
        uint256 addedValue,
        Callbacks memory cbs
    ) internal returns (bool) {
        uint256 currentAllowance = cbs.getAllowance(msgSender, spender, self._allowances[msgSender][spender]);
        _approve(self, msgSender, spender, currentAllowance + addedValue, cbs);
        return true;
    }

    function decreaseAllowance(
        Data storage self,
        address msgSender,
        address spender,
        uint256 subtractedValue,
        Callbacks memory cbs
    ) internal returns (bool) {
        uint256 currentAllowance = cbs.getAllowance(msgSender, spender, self._allowances[msgSender][spender]);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(self, msgSender, spender, currentAllowance - subtractedValue, cbs);
        }

        return true;
    }

    function _transfer(
        Data storage self,
        address sender,
        address recipient,
        uint256 amount,
        Callbacks memory cbs
    ) internal {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        cbs.beforeTokenTransfer(sender, recipient, amount);

        uint256 senderBalance = cbs.getBalance(sender, self._balances[sender]);
        require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            self._balances[sender] = cbs.setBalance(sender, senderBalance - amount);
        }
        self._balances[recipient] = cbs.setBalance(recipient, cbs.getBalance(recipient, self._balances[recipient]) + amount);

        cbs.afterTokenTransfer(sender, recipient, amount);
    }

    function _mint(
        Data storage self,
        address account,
        uint256 amount,
        Callbacks memory cbs
    ) internal {
        require(account != address(0), "ERC20: mint to the zero address");

        cbs.beforeTokenTransfer(address(0), account, amount);

        self._totalSupply = cbs.setTotalSupply(cbs.getTotalSupply(self._totalSupply) + amount);
        self._balances[account] = cbs.setBalance(account, cbs.getBalance(account, self._balances[account]) + amount);

        cbs.afterTokenTransfer(address(0), account, amount);
    }

    function _burn(
        Data storage self,
        address account,
        uint256 amount,
        Callbacks memory cbs
    ) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        cbs.beforeTokenTransfer(account, address(0), amount);

        uint256 accountBalance = cbs.getBalance(account, self._balances[account]);
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            self._balances[account] = cbs.setBalance(account, accountBalance - amount);
        }
        self._totalSupply = cbs.setTotalSupply(cbs.getTotalSupply(self._totalSupply) - amount);

        cbs.afterTokenTransfer(account, address(0), amount);
    }

    function _approve(
        Data storage self,
        address owner,
        address spender,
        uint256 amount,
        Callbacks memory cbs
    ) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        cbs.beforeTokenApproval(owner, spender, amount);

        self._allowances[owner][spender] = cbs.setAllowance(owner, spender, amount);

        cbs.afterTokenApproval(owner, spender, amount);
    }
}
