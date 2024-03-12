pragma solidity ^0.8.20;

import {ERC20Burnable} from "../../../../openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MyERC20Burnable is ERC20Burnable {

    constructor(address spender, string memory name_, string memory symbol_) ERC20Capped() ERC20(name_, symbol_) {
        _mint(msg.sender, 100);
        _approve(msg.sender, spender, 10);
    }

    function Burn(uint256 value) public {
        burn(value);
    }

    function BurnFrom(address account, uint256 value) public {
        burnFrom(account, value);
    }
}