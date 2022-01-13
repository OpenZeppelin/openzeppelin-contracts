// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../security/ReentrancyGuardUpgradeable.sol";
import "./ReentrancyAttackUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ReentrancyMockUpgradeable is Initializable, ReentrancyGuardUpgradeable {
    uint256 public counter;

    function __ReentrancyMock_init() internal onlyInitializing {
        __ReentrancyGuard_init_unchained();
        __ReentrancyMock_init_unchained();
    }

    function __ReentrancyMock_init_unchained() internal onlyInitializing {
        counter = 0;
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
            (bool success, ) = address(this).call(abi.encodeWithSignature("countThisRecursive(uint256)", n - 1));
            require(success, "ReentrancyMock: failed call");
        }
    }

    function countAndCall(ReentrancyAttackUpgradeable attacker) public nonReentrant {
        _count();
        bytes4 func = bytes4(keccak256("callback()"));
        attacker.callSender(func);
    }

    function _count() private {
        counter += 1;
    }
    uint256[49] private __gap;
}
