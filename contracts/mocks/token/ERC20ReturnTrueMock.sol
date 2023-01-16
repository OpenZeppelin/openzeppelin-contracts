// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract ERC20ReturnTrueMock {
    mapping(address => uint256) private _allowances;

    function transfer(address, uint256) public pure returns (bool) {
        return true;
    }

    function transferFrom(address, address, uint256) public pure returns (bool) {
        return true;
    }

    function approve(address, uint256) public pure returns (bool) {
        return true;
    }

    function setAllowance(address account, uint256 allowance_) public {
        _allowances[account] = allowance_;
    }

    function allowance(address owner, address) public view returns (uint256) {
        return _allowances[owner];
    }
}
