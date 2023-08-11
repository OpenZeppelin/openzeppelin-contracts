// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {Ownable} from "../patched/access/Ownable.sol";

contract OwnableHarness is Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    function restricted() external onlyOwner {}
}
