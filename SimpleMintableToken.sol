// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleMintableToken is ERC20 {
    constructor() ERC20("SimpleMintableToken", "SMT") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
