// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {ERC7540} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540.sol";
import {ERC7540DelayDeposit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540DelayDeposit.sol";
import {ERC7540DelayRedeem} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540DelayRedeem.sol";
import {ERC7540DelayMock} from "@openzeppelin/contracts/mocks/token/ERC7540DelayMock.sol";

/// @dev Delay vault that caps each claim through the `_asyncMaxDeposit` and `_asyncMaxRedeem` hooks only.
contract ERC7540DelayCappedVault is ERC7540DelayMock {
    uint256 private constant CAP = 400e18;

    constructor(IERC20 asset_) ERC20("Vault", "VLT") ERC7540(asset_) {}

    function _asyncMaxDeposit(address owner) internal view override(ERC7540, ERC7540DelayDeposit) returns (uint256) {
        uint256 max = super._asyncMaxDeposit(owner);
        return max < CAP ? max : CAP;
    }

    function _asyncMaxRedeem(address owner) internal view override(ERC7540, ERC7540DelayRedeem) returns (uint256) {
        uint256 max = super._asyncMaxRedeem(owner);
        return max < CAP ? max : CAP;
    }
}

contract ERC7540DelayCappedClaimTest is Test {
    ERC20Mock private _asset;
    ERC7540DelayCappedVault private _vault;
    address private _alice = makeAddr("alice");
    address private _bob = makeAddr("bob");

    function setUp() public {
        _asset = new ERC20Mock();
        _vault = new ERC7540DelayCappedVault(_asset);

        for (uint256 i = 0; i < 2; ++i) {
            address user = i == 0 ? _alice : _bob;
            _asset.mint(user, 1000e18);
            vm.startPrank(user);
            _asset.approve(address(_vault), type(uint256).max);
            _vault.requestDeposit(1000e18, user, user);
            vm.stopPrank();
        }
        vm.warp(block.timestamp + 2 hours);
    }

    function testMintMaxMintRespectsDepositCap() public {
        assertEq(_vault.maxMint(_alice), 400e18);

        vm.startPrank(_alice);
        while (_vault.maxMint(_alice) > 0) _vault.mint(_vault.maxMint(_alice), _alice, _alice);
        vm.stopPrank();

        assertEq(_vault.balanceOf(_alice), 1000e18);
    }

    function testWithdrawMaxWithdrawRespectsRedeemCap() public {
        vm.startPrank(_bob);
        while (_vault.maxDeposit(_bob) > 0) _vault.deposit(_vault.maxDeposit(_bob), _bob, _bob);
        vm.startPrank(_alice);
        while (_vault.maxDeposit(_alice) > 0) _vault.deposit(_vault.maxDeposit(_alice), _alice, _alice);
        _vault.requestRedeem(1000e18, _alice, _alice);
        vm.warp(block.timestamp + 2 hours);

        assertEq(_vault.maxWithdraw(_alice), 400e18);

        while (_vault.maxWithdraw(_alice) > 0) _vault.withdraw(_vault.maxWithdraw(_alice), _alice, _alice);
        vm.stopPrank();

        assertEq(_asset.balanceOf(_alice), 1000e18);
        assertEq(_vault.convertToAssets(_vault.balanceOf(_bob)), 1000e18);
    }
}
