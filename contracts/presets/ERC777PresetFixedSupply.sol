// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import "../token/ERC777/ERC777.sol";

/**
 * @dev {ERC777} token, including:
 *
 *  - Preconfigured initial supply
 *  - NO access control mechanism (for minting/pausing) and hence NO governance
 *
 * This contract uses {ERC777} - head to
 * its documentation for details.
 */
contract ERC777PresetFixedSupply is ERC777 {
    /**
     * @dev Mints initialSupply amount of tokens and transfers to address owner.
     *
     * See {ERC777-constructor}.
     *
     * Accepts additional parameter owner of type address to facilitate the usage
     * with factory patterns.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner,
        address[] memory defaultOperators
    ) public ERC777(name, symbol, defaultOperators) {
        _mint(owner, initialSupply, "", "");
    }
}
