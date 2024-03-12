pragma solidity ^0.8.20;

import {ERC20Capped} from "../../../../openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MyERC20Capped is ERC20Capped {

    constructor(uint256 cap_, string memory name_, string memory symbol_) ERC20Capped(cap_) ERC20(name_, symbol_) {

    }

    function Mint(uint256 value) public {
        _mint(msg.sender, value);
    }
}