// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import "../token/ERC20/ERC20Burnable.sol";

/**
 * @dev Extension of {ERC20} and {ERC20Burnable} with fixed initialSupply.
 *
 * Tip: Contract is preconfigured with fixed initial supply.
 * minting / pausing functionality is not supported. This removes the need of access control and thereby governance.
 */
contract ERC20PresetFixedSupply is ERC20Burnable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) public ERC20(name, symbol) {
        _mint(owner, initialSupply);
    }
}
