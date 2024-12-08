// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GTA6Coin is ERC20, Ownable {
    constructor() ERC20("GTA6Coin", "GTA6") {
        // Mint initial supply to the contract owner
        _mint(msg.sender, 69000000000 * 10 ** decimals());
    }

    // Function to allow the owner to mint more tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
