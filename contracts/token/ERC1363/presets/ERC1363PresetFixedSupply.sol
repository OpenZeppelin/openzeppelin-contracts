// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC1363.sol";

/**
 * @dev {ERC1363} token, including:
 *
 *  - Preminted initial supply
 *
 */
contract ERC1363PresetFixedSupply is ERC1363 {
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) {
        _mint(owner, initialSupply);
    }
}
