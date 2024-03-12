pragma solidity ^0.8.20;

import {ERC20Wrapper} from "../../../../openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Wrapper.sol";
import {ERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract MyERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, 100);
    }
}

contract MyERC20Wrapper is ERC20Wrapper {

    constructor(address token, string memory name_, string memory symbol_) ERC20Wrapper(IERC20(token)) ERC20(name_, symbol_) {
        _mint(msg.sender, 100);
    }

    //decimals

    //underlying

    //depositFor

    //withdrawTo

    function Recover(address account) public returns (uint256) {
        return _recover(account);
    }
}