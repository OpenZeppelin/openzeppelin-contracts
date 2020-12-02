// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import "../token/ERC20/ERC20Burnable.sol";

/**
 * @dev {ERC20} token, including:
 *
 *  - Preconfigured initial supply
 *  - ability for holders to burn (destroy) their tokens
 *  - NO access control mechanism (for minting/pausing) and hence NO governance
 *
 * This contract uses {ERC20Burnable} to include burn capabilities - head to
 * its documentation for details.
 */
contract ERC20PresetFixedSupply is ERC20Burnable {
    /**
     * @dev Mints initialSupply amount of token and transfers to address owner.  
     *
     * See {ERC20-constructor}.
     * 
     * Accepts additional parameter owner of type address to facilitate the usage
     * with factory patterns. 
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) public ERC20(name, symbol) {
        _mint(owner, initialSupply);
    }
}
