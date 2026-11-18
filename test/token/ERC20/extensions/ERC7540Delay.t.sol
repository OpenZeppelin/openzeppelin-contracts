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

uint256 constant CAP = 400e18;

/// @dev Delay vault that caps each claim through the `_asyncMaxDeposit` and `_asyncMaxRedeem` hooks only.
contract ERC7540DelayCappedHooksVault is ERC7540DelayMock {
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

/// @dev Delay vault that caps the public {maxDeposit} and {maxRedeem} views only, leaving {maxMint} and {maxWithdraw} uncapped.
contract ERC7540DelayCappedViewsVault is ERC7540DelayMock {
    constructor(IERC20 asset_) ERC20("Vault", "VLT") ERC7540(asset_) {}

    function maxDeposit(address owner) public view override returns (uint256) {
        uint256 max = super.maxDeposit(owner);
        return max < CAP ? max : CAP;
    }

    function maxRedeem(address owner) public view override returns (uint256) {
        uint256 max = super.maxRedeem(owner);
        return max < CAP ? max : CAP;
    }
}

contract ERC7540DelayCappedClaimTest is Test {
    ERC20Mock private _asset = new ERC20Mock();
    address private _alice = makeAddr("alice");
    address private _bob = makeAddr("bob");

    function testMintMaxMintRespectsCappedHook() public {
        ERC7540 vault = _setUp(new ERC7540DelayCappedHooksVault(_asset));
        assertEq(vault.maxMint(_alice), CAP);

        vm.startPrank(_alice);
        while (vault.maxMint(_alice) > 0) vault.mint(vault.maxMint(_alice), _alice, _alice);
        vm.stopPrank();

        assertEq(vault.balanceOf(_alice), 1000e18);
    }

    function testWithdrawMaxWithdrawRespectsCappedHook() public {
        ERC7540 vault = _setUp(new ERC7540DelayCappedHooksVault(_asset));
        _claimDepositsAndRequestRedeem(vault);
        assertEq(vault.maxWithdraw(_alice), CAP);

        vm.startPrank(_alice);
        while (vault.maxWithdraw(_alice) > 0) vault.withdraw(vault.maxWithdraw(_alice), _alice, _alice);
        vm.stopPrank();

        assertEq(_asset.balanceOf(_alice), 1000e18);
        assertEq(vault.convertToAssets(vault.balanceOf(_bob)), 1000e18);
    }

    function testMintMaxMintConsumesFullClaimWithCappedView() public {
        ERC7540 vault = _setUp(new ERC7540DelayCappedViewsVault(_asset));
        assertEq(vault.maxDeposit(_alice), CAP);
        assertEq(vault.maxMint(_alice), 1000e18);

        vm.prank(_alice);
        vault.mint(1000e18, _alice, _alice);

        assertEq(vault.balanceOf(_alice), 1000e18);
        assertEq(vault.maxDeposit(_alice), 0);
        assertEq(vault.maxMint(_alice), 0);
    }

    function testWithdrawMaxWithdrawConsumesFullClaimWithCappedView() public {
        ERC7540 vault = _setUp(new ERC7540DelayCappedViewsVault(_asset));
        _claimDepositsAndRequestRedeem(vault);
        assertEq(vault.maxRedeem(_alice), CAP);
        assertEq(vault.maxWithdraw(_alice), 1000e18);

        vm.prank(_alice);
        vault.withdraw(1000e18, _alice, _alice);

        assertEq(_asset.balanceOf(_alice), 1000e18);
        assertEq(vault.maxRedeem(_alice), 0);
        assertEq(vault.maxWithdraw(_alice), 0);
        assertEq(vault.convertToAssets(vault.balanceOf(_bob)), 1000e18);
    }

    /// @dev Alice and Bob each request a deposit of 1000 assets, then wait for it to mature.
    function _setUp(ERC7540 vault) private returns (ERC7540) {
        for (uint256 i = 0; i < 2; ++i) {
            address user = i == 0 ? _alice : _bob;
            _asset.mint(user, 1000e18);
            vm.startPrank(user);
            _asset.approve(address(vault), type(uint256).max);
            vault.requestDeposit(1000e18, user, user);
            vm.stopPrank();
        }
        vm.warp(block.timestamp + 2 hours);
        return vault;
    }

    /// @dev Alice and Bob claim their deposits, then Alice requests to redeem all her shares and waits for it to mature.
    function _claimDepositsAndRequestRedeem(ERC7540 vault) private {
        for (uint256 i = 0; i < 2; ++i) {
            address user = i == 0 ? _alice : _bob;
            vm.startPrank(user);
            while (vault.maxDeposit(user) > 0) vault.deposit(vault.maxDeposit(user), user, user);
            vm.stopPrank();
        }
        vm.prank(_alice);
        vault.requestRedeem(1000e18, _alice, _alice);
        vm.warp(block.timestamp + 2 hours);
    }
}
