// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "../token/ERC20/ERC20Capped.sol";

contract ERC20CappedMock is ERC20Capped {
    constructor (string memory name, string memory symbol, uint256 cap)
        public ERC20(name, symbol) ERC20Capped(cap)
    { }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}
