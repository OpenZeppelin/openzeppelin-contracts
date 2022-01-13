// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/math/SignedSafeMathUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract SignedSafeMathMockUpgradeable is Initializable {
    function __SignedSafeMathMock_init() internal onlyInitializing {
        __SignedSafeMathMock_init_unchained();
    }

    function __SignedSafeMathMock_init_unchained() internal onlyInitializing {
    }
    function mul(int256 a, int256 b) public pure returns (int256) {
        return SignedSafeMathUpgradeable.mul(a, b);
    }

    function div(int256 a, int256 b) public pure returns (int256) {
        return SignedSafeMathUpgradeable.div(a, b);
    }

    function sub(int256 a, int256 b) public pure returns (int256) {
        return SignedSafeMathUpgradeable.sub(a, b);
    }

    function add(int256 a, int256 b) public pure returns (int256) {
        return SignedSafeMathUpgradeable.add(a, b);
    }
    uint256[50] private __gap;
}
