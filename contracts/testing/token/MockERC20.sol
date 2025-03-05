// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../../token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Implementation of the ERC20 token standard for testing purposes.
 * This contract allows anyone to mint and burn tokens, making it suitable for testing.
 */
contract MockERC20 is ERC20 {
    /**
     * @dev Constructor that sets the name and symbol of the token.
     * @param name The name of the token
     * @param symbol The symbol of the token
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    /**
     * @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     * @param account The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the total supply.
     * @param account The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }
} 