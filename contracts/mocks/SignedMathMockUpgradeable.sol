// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/math/SignedMathUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract SignedMathMockUpgradeable is Initializable {
    function __SignedMathMock_init() internal onlyInitializing {
        __SignedMathMock_init_unchained();
    }

    function __SignedMathMock_init_unchained() internal onlyInitializing {
    }
    function max(int256 a, int256 b) public pure returns (int256) {
        return SignedMathUpgradeable.max(a, b);
    }

    function min(int256 a, int256 b) public pure returns (int256) {
        return SignedMathUpgradeable.min(a, b);
    }

    function average(int256 a, int256 b) public pure returns (int256) {
        return SignedMathUpgradeable.average(a, b);
    }
    uint256[50] private __gap;
}
