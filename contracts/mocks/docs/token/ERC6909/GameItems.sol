// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC6909} from "../../../../token/ERC6909/draft-ERC6909.sol";

contract GameItems is ERC6909 {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant THORS_HAMMER = 2;
    uint256 public constant SWORD = 3;
    uint256 public constant SHIELD = 4;

    constructor() {
        _mint(msg.sender, GOLD, 10 ** 18);
        _mint(msg.sender, SILVER, 10 ** 27);
        _mint(msg.sender, THORS_HAMMER, 1);
        _mint(msg.sender, SWORD, 10 ** 9);
        _mint(msg.sender, SHIELD, 10 ** 9);
    }
}
