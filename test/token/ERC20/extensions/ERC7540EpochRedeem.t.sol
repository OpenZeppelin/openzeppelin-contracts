// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

// solhint-disable func-name-mixedcase

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC7540} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540.sol";
import {ERC7540EpochMock} from "@openzeppelin/contracts/mocks/token/ERC7540EpochMock.sol";

contract EpochVault is ERC7540EpochMock {
    constructor(
        IERC20 asset_,
        address tmpShareHolder
    ) ERC20("Vault", "VLT") ERC7540(asset_) ERC7540EpochMock(tmpShareHolder) {}

    function fulfillRedeem(uint256 epochId, uint256 assets) external {
        _fulfillRedeem(epochId, assets);
    }

    function mintShares(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function totalOutstandingShares() external view returns (uint256) {
        return _totalOutstandingShares();
    }
}

/// @dev Fuzz regression for the redeem-side rounding findings on the epoch strategy.
/// Locks in the properties audit H-02 (fulfilled epoch cannot regress to the Pending
/// sentinel) and audit C-02 (no cross-epoch borrowing) against the floor-aligned
/// per-epoch entitlement in `_consumeClaimableWithdraw`.
contract ERC7540EpochRedeemFuzzTest is Test {
    EpochVault internal vault;
    ERC20Mock internal token;

    address internal constant ALICE = address(0xA11CE);
    address internal constant BOB = address(0xB0B);
    address internal constant CUSTODY = address(0xC057);

    uint256 internal constant WEEK = 7 days;

    function setUp() public {
        token = new ERC20Mock();
        vault = new EpochVault(token, address(0));
    }

    // Two epochs so `maxWithdraw(alice)` sums floor entitlements across epochs — the
    // shape that used to let a ceil-rounded `requested` in `_consumeClaimableWithdraw`
    // drain the older epoch's `totalAssets` to 0 while `totalShares` stayed positive,
    // freezing Bob behind a Pending-looking epoch.
    function testFuzz_WithdrawClaimPreservesFulfilledSentinel(
        uint128 rA1,
        uint128 rB1,
        uint128 fulfillA1,
        uint128 rA2,
        uint128 fulfillA2
    ) public {
        rA1 = uint128(bound(rA1, 1, 1e30));
        rB1 = uint128(bound(rB1, 1, 1e30));
        rA2 = uint128(bound(rA2, 1, 1e30));
        fulfillA1 = uint128(bound(fulfillA1, 1, 1e30));
        fulfillA2 = uint128(bound(fulfillA2, 1, 1e30));

        // Seed share balances and a vault asset reserve for redemptions to pay out.
        vault.mintShares(ALICE, uint256(rA1) + rA2);
        vault.mintShares(BOB, rB1);
        token.mint(address(vault), uint256(fulfillA1) + fulfillA2);

        vm.prank(ALICE);
        vault.requestRedeem(rA1, ALICE, ALICE);
        vm.prank(BOB);
        vault.requestRedeem(rB1, BOB, BOB);

        uint256 epoch1 = vault.currentRedeemEpoch();
        vm.warp(block.timestamp + WEEK);

        vm.prank(ALICE);
        vault.requestRedeem(rA2, ALICE, ALICE);
        uint256 epoch2 = vault.currentRedeemEpoch();
        assertGt(epoch2, epoch1);

        vm.warp(block.timestamp + WEEK);
        vault.fulfillRedeem(epoch1, fulfillA1);
        vault.fulfillRedeem(epoch2, fulfillA2);

        uint256 tS1Before = vault.totalRedeemShares(epoch1);

        uint256 aliceMax = vault.maxWithdraw(ALICE);
        if (aliceMax > 0) {
            vm.prank(ALICE);
            vault.withdraw(aliceMax, ALICE, ALICE);
        }

        // Sentinel invariant on epoch1: fulfilled epoch cannot regress to Pending
        // (totalAssets == 0) while shares remain.
        uint256 tS1 = vault.totalRedeemShares(epoch1);
        uint256 tA1 = vault.totalRedeemAssets(epoch1);
        assertFalse(tA1 == 0 && tS1 > 0, "epoch1 sentinel dirtied");

        // Alice never burned more shares from epoch1 than her request there.
        assertLe(tS1Before - tS1, rA1, "epoch1 share over-consumption");

        // Bob's claim slot on epoch1 stays reachable.
        assertEq(vault.claimableRedeemRequest(epoch1, BOB), rB1);
    }

    // A withdraw that exhausts a controller's asset entitlement in an epoch dequeues it and must
    // consume the entire share request, leaving no residue behind the popped entry.
    function testFuzz_WithdrawExhaustsRequest(uint128 rA, uint128 rB, uint128 fulfillA) public {
        rA = uint128(bound(rA, 1, 1e30));
        rB = uint128(bound(rB, 1, 1e30));
        fulfillA = uint128(bound(fulfillA, 1, 1e30));

        uint256 epoch = _requestAndFulfill(rA, rB, fulfillA);

        uint256 aliceMax = vault.maxWithdraw(ALICE);
        vm.assume(aliceMax > 0);
        vm.prank(ALICE);
        vault.withdraw(aliceMax, ALICE, ALICE);

        assertEq(vault.redeemEpochs(ALICE, 0, type(uint64).max).length, 0);
        assertEq(vault.claimableRedeemRequest(epoch, ALICE), 0);
        assertEq(vault.maxRedeem(ALICE), 0);

        _claimAllAndCheckDrained(BOB, epoch);
    }

    // A partial withdraw must burn at least the pro-rata shares for the assets it receives (rounding
    // in favor of the vault), and the epoch must still drain completely afterwards.
    function testFuzz_PartialWithdrawRoundsUp(uint128 rA, uint128 rB, uint128 fulfillA, uint256 assets) public {
        rA = uint128(bound(rA, 1, 1e30));
        rB = uint128(bound(rB, 1, 1e30));
        fulfillA = uint128(bound(fulfillA, 1, 1e30));

        uint256 epoch = _requestAndFulfill(rA, rB, fulfillA);

        uint256 aliceMax = vault.maxWithdraw(ALICE);
        vm.assume(aliceMax > 1);
        assets = bound(assets, 1, aliceMax - 1);

        uint256 tS = vault.totalRedeemShares(epoch);
        uint256 tA = vault.totalRedeemAssets(epoch);

        vm.prank(ALICE);
        uint256 shares = vault.withdraw(assets, ALICE, ALICE);
        assertGe(shares * tA, assets * tS, "partial withdraw rounded in favor of caller");

        _claimAllAndCheckDrained(ALICE, epoch);
        _claimAllAndCheckDrained(BOB, epoch);
    }

    // A partial withdraw by the last claimant of an epoch can round up to its whole remaining request.
    // The assets left in the epoch can no longer be claimed, so they must be released to the vault.
    function test_LastPartialWithdrawReleasesResidue() public {
        vault.mintShares(ALICE, 10);
        token.mint(address(vault), 1000);

        vm.prank(ALICE);
        vault.requestRedeem(10, ALICE, ALICE);

        uint256 epoch = vault.currentRedeemEpoch();
        vm.warp(block.timestamp + WEEK);
        vault.fulfillRedeem(epoch, 1000);
        assertEq(vault.totalAssets(), 0); // fulfilled assets are owed to the claimant

        vm.prank(ALICE);
        assertEq(vault.withdraw(999, ALICE, ALICE), 10); // ceil(999 * 10 / 1000) consumes the whole request

        assertEq(vault.maxWithdraw(ALICE), 0);
        assertEq(vault.totalRedeemShares(epoch), 0);
        assertEq(vault.totalRedeemAssets(epoch), 0);
        assertEq(vault.totalPendingRedeemShares(), 0);
        assertEq(token.balanceOf(ALICE), 999);
        assertEq(vault.totalAssets(), 1);
    }

    // Whatever the claim order and custody model, once every controller has claimed, the epoch is
    // drained.
    function testFuzz_LastPartialWithdrawDrainsEpoch(
        uint128 rA,
        uint128 rB,
        uint128 fulfillA,
        uint256 assets,
        bool escrow
    ) public {
        vault = new EpochVault(token, escrow ? CUSTODY : address(0));

        rA = uint128(bound(rA, 1, 1e30));
        rB = uint128(bound(rB, 1, 1e30));
        fulfillA = uint128(bound(fulfillA, 1, 1e30));

        uint256 epoch = _requestAndFulfill(rA, rB, fulfillA);

        uint256 bobMax = vault.maxRedeem(BOB);
        if (bobMax > 0) {
            vm.prank(BOB);
            vault.redeem(bobMax, BOB, BOB);
        }

        uint256 aliceMax = vault.maxWithdraw(ALICE);
        vm.assume(aliceMax > 1);
        assets = bound(assets, 1, aliceMax - 1);
        vm.prank(ALICE);
        vault.withdraw(assets, ALICE, ALICE);

        uint256 aliceRest = vault.maxRedeem(ALICE);
        if (aliceRest > 0) {
            vm.prank(ALICE);
            vault.redeem(aliceRest, ALICE, ALICE);
        }

        assertEq(vault.totalRedeemShares(epoch), 0, "epoch shares not drained");
        assertEq(vault.totalRedeemAssets(epoch), 0, "epoch assets not drained");
        assertEq(vault.totalPendingRedeemShares(), 0, "pending shares not drained");
        assertEq(vault.balanceOf(CUSTODY), 0, "shares left at custody");
        assertEq(vault.totalSupply(), 0, "shares left in supply");
        assertEq(vault.totalOutstandingShares(), vault.totalSupply(), "claimable shares not released");
        assertEq(vault.totalAssets(), token.balanceOf(address(vault)), "claimable assets not released");
    }

    function _requestAndFulfill(uint256 rA, uint256 rB, uint256 fulfillA) internal returns (uint256 epoch) {
        vault.mintShares(ALICE, rA);
        vault.mintShares(BOB, rB);
        token.mint(address(vault), fulfillA);

        vm.prank(ALICE);
        vault.requestRedeem(rA, ALICE, ALICE);
        vm.prank(BOB);
        vault.requestRedeem(rB, BOB, BOB);

        epoch = vault.currentRedeemEpoch();
        vm.warp(block.timestamp + WEEK);
        vault.fulfillRedeem(epoch, fulfillA);
    }

    function _claimAllAndCheckDrained(address controller, uint256 epoch) internal {
        uint256 max = vault.maxRedeem(controller);
        if (max > 0) {
            vm.prank(controller);
            vault.redeem(max, controller, controller);
        }
        assertEq(vault.redeemEpochs(controller, 0, type(uint64).max).length, 0);
        if (controller == BOB) {
            assertEq(vault.totalRedeemShares(epoch), 0, "epoch shares not drained");
            assertEq(vault.totalRedeemAssets(epoch), 0, "epoch assets not drained");
            assertEq(vault.totalPendingRedeemShares(), 0, "pending shares not drained");
        }
    }
}
