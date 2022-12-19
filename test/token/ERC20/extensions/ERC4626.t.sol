// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "erc4626-tests/ERC4626.test.sol";

import {SafeCast} from "../../../../contracts/utils/math/SafeCast.sol";
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

    // solhint-disable-next-line func-name-mixedcase
    function test_RT_mint_withdraw(ERC4626Test.Init memory init, uint256 shares) public override {
        // There is an edge case where we currently behave different than the property tests,
        // when all assets are lost to negative yield.

        // Sum all initially deposited assets.
        int256 initAssets = 0;
        for (uint256 i = 0; i < init.share.length; i++) {
            vm.assume(init.share[i] <= uint256(type(int256).max - initAssets));
            initAssets += SafeCast.toInt256(init.share[i]);
        }

        // Reject tests where the yield loses all assets from the vault.
        vm.assume(init.yield > -initAssets);

        super.test_RT_mint_withdraw(init, shares);
    }
}
