// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "../patched/access/Ownable.sol";

contract OwnableHarness is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    function restricted() external onlyOwner {}
}
