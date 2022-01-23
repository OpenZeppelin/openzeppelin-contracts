// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import "../token/ERC777/ERC777.sol";

/**
 * @dev {ERC777} token, including:
 *
 *  - Preminted initial supply
 *  - No access control mechanism (for minting/pausing) and hence no governance
 *
 * _Available since v3.4._
 */
contract ERC777PresetFixedSupply is ERC777 {
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.  
     *
     * See {ERC777-constructor}.
     */
    constructor(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators,
        uint256 initialSupply,
        address owner
    ) public ERC777(name, symbol, defaultOperators) {
        _mint(owner, initialSupply, "", "");
    }
}
