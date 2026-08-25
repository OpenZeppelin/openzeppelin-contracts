// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OwnableRenounceable} from "../patched/access/OwnableRenounceable.sol";
import {Ownable} from "../patched/access/Ownable.sol";

contract OwnableRenounceableHarness is OwnableRenounceable {
    constructor(address initialOwner) Ownable(initialOwner) {}

    function restricted() external onlyOwner {}
}
