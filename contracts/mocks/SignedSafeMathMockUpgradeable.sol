// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/math/SignedSafeMathUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract SignedSafeMathMockUpgradeable is Initializable {
    function __SignedSafeMathMock_init() internal onlyInitializing {
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

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
