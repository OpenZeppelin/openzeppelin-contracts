// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import "../token/ERC777/ERC777.sol";

/**
 * @dev Extension of {ERC777} with fixed initialSupply.
 *
 * Tip: Contract is preconfigured with fixed initial supply.
 * 
 */
contract ERC777PresetFixedSupply is ERC777 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address[] memory defaultOperators
    ) public ERC777(name, symbol, defaultOperators) {
        _mint(msg.sender, initialSupply, "", "");
    }
}
