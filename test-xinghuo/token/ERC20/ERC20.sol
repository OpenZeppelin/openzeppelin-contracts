pragma solidity ^0.8.20;

import {ERC20} from "../../openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {

    }

    function Name() public view returns (string memory) {
        return name();
    }

    function Symbol() public view returns (string memory) {
        return symbol();
    }

    function Decimals() public view returns (uint8) {
        return decimals();
    }

    function TotalSupply() public view returns (uint256) {
        return totalSupply();
    }

    function BalanceOf(address account) public view returns (uint256) {
        return balanceOf(account);
    }

    function TTransfer(address to, uint256 value) public returns (bool) {
        return transfer(to, value);
    }

    function Allowance(address owner, address spender) public view returns (uint256) {
        return allowance(owner, spender);
    }

    function AAapprove(address spender, uint256 value) public returns (bool) {
        return approve(spender, value);
    }

    function TransferFrom(address from, address to, uint256 value) public returns (bool) {
        return transferFrom(from, to, value);
    }

    function Mint(address account, uint256 value) public {
        _mint(account, value);
    }

    function Burn(address account, uint256 value) public {
        _burn(account, value);
    }


}