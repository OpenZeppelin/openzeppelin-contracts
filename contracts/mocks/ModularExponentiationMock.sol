// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/math/ModularExponentiation.sol";
import "../utils/math/Math.sol";

contract ModularExponentiationMock {
    function modExp(
        uint256 b,
        uint256 e,
        uint256 m
    ) public returns (uint256) {
        return ModularExponentiation.modExp(b, e, m);
    }
}
