// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity >0.8.999 <0.10.0;

import {ERC20} from "../../../../token/ERC20/ERC20.sol";

contract GLDToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Gold", "GLD") {
        _mint(msg.sender, initialSupply);
    }
}
