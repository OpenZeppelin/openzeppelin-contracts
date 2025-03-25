// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ReentrancyMock} from "./ReentrancyMock.sol";
import {ReentrancyAttack} from "./ReentrancyAttack.sol";

contract ReentrancyAttackHelper is ReentrancyAttack {
    ReentrancyMock public target;
    bool public inReentrancy;

    constructor(ReentrancyMock _target) {
        target = _target;
    }

    function startAttack() public {
        inReentrancy = true;
        target.countAndCall(this);
        inReentrancy = false;
    }

    function callSender(bytes calldata _data) public override returns (bool success) {
        if (inReentrancy) {
            target.readOnlyFunction();
        }
        return true;
    }
}
