// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC4626Test} from "erc4626-tests/ERC4626.test.sol";

import {SafeCast} from "openzeppelin/utils/math/SafeCast.sol";
import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";
import {ERC4626} from "openzeppelin/token/ERC20/extensions/ERC4626.sol";

import {ERC20Mock} from "openzeppelin/mocks/ERC20Mock.sol";
import {ERC4626Mock} from "openzeppelin/mocks/ERC4626Mock.sol";
import {ERC4626OffsetMock} from "openzeppelin/mocks/token/ERC4626OffsetMock.sol";

contract ERC4626VaultOffsetMock is ERC4626OffsetMock {
    constructor(
        ERC20 underlying_,
        uint8 offset_
    ) ERC20("My Token Vault", "MTKNV") ERC4626(underlying_) ERC4626OffsetMock(offset_) {}
}

contract ERC4626StdTest is ERC4626Test {
    ERC20 private _underlying = new ERC20Mock();

    function setUp() public override {
        _underlying_ = address(_underlying);
        _vault_ = address(new ERC4626Mock(_underlying_));
        _delta_ = 0;
        _vaultMayBeEmpty = true;
        _unlimitedAmount = true;
    }

    /**
     * @dev Check the case where calculated `decimals` value overflows the `uint8` type.
     */
    function testFuzzDecimalsOverflow(uint8 offset) public {
        /// @dev Remember that the `_underlying` exhibits a `decimals` value of 18.
        offset = uint8(bound(uint256(offset), 238, uint256(type(uint8).max)));
        ERC4626VaultOffsetMock erc4626VaultOffsetMock = new ERC4626VaultOffsetMock(_underlying, offset);
        vm.expectRevert();
        erc4626VaultOffsetMock.decimals();
    }
}
