// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "erc4626-tests/ERC4626.test.sol";

import {ERC20Mock} from "../../../../contracts/mocks/ERC20Mock.sol";
import {ERC4626Mock, IERC20Metadata} from "../../../../contracts/mocks/ERC4626Mock.sol";

contract ERC4626StdTest is ERC4626Test {
    function setUp() public override {
        _underlying_ = address(new ERC20Mock("MockERC20", "MockERC20", address(this), 0));
        _vault_ = address(new ERC4626Mock(IERC20Metadata(_underlying_), "MockERC4626", "MockERC4626"));
        _delta_ = 0;
        _vaultMayBeEmpty = false;
        _unlimitedAmount = true;
    }
}
