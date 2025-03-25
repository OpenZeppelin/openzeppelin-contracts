// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ReentrancyGuard} from "../utils/ReentrancyGuard.sol";
import {ReentrancyAttack} from "./ReentrancyAttack.sol";

contract ReentrancyMock is ReentrancyGuard {
    uint256 public counter;

    constructor() {
        counter = 0;
    }

    function readOnlyFunction() public nonReentrantView view returns (uint256) {
        return 42;
    }

    function startReentrancy() public nonReentrant {
        // Modifier nonReentrant sudah memanggil _nonReentrantBefore secara internal
    }

    function callback() external nonReentrant {
        _count();
    }

    function countLocalRecursive(uint256 n) public nonReentrant {
        if (n > 0) {
            _count();
            countLocalRecursive(n - 1);
        }
    }

    function countThisRecursive(uint256 n) public nonReentrant {
        if (n > 0) {
            _count();
            (bool success, ) = address(this).call(abi.encodeCall(this.countThisRecursive, (n - 1)));
            require(success, "ReentrancyMock: failed call");
        }
    }

    function countAndCall(ReentrancyAttack attacker) public nonReentrant {
        _count();
        bool success = attacker.callSender(abi.encodeCall(this.callback, ()));
        require(success, "ReentrancyMock: failed call");
    }

    function _count() private {
        counter += 1;
    }

    function guardedCheckEntered() public nonReentrant {
        require(_reentrancyGuardEntered());
    }

    function unguardedCheckNotEntered() public view {
        require(!_reentrancyGuardEntered());
    }
    function startReentrancyWithCallback() public nonReentrant {
    (bool success, ) = address(this).call(abi.encodeCall(this.callback, ()));
    require(success, "ReentrancyMock: failed call");
}
}