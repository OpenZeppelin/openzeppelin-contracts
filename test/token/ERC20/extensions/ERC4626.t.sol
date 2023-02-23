// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "erc4626-tests/ERC4626.test.sol";

import {SafeCast} from "../../../../contracts/utils/math/SafeCast.sol";
import {ERC20Mock} from "../../../../contracts/mocks/ERC20Mock.sol";
import {ERC4626Mock} from "../../../../contracts/mocks/ERC4626Mock.sol";

contract ERC4626StdTest is ERC4626Test {
    function setUp() public override {
        _underlying_ = address(new ERC20Mock());
        _vault_ = address(new ERC4626Mock(_underlying_));
        _delta_ = 0;
        _vaultMayBeEmpty = true;
        _unlimitedAmount = true;
    }
}
