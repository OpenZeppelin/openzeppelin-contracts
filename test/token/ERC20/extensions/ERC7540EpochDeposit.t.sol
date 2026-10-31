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

    function fulfillDeposit(uint256 epochId, uint256 shares) external {
        _fulfillDeposit(epochId, shares);
    }

    function totalOutstandingShares() external view returns (uint256) {
        return _totalOutstandingShares();
    }
}

/// @dev Fuzz regression for the deposit-side rounding findings on the epoch strategy.
/// Locks in the properties audit H-02 (fulfilled epoch cannot regress to the Pending
/// sentinel) and audit C-02 (no cross-epoch borrowing) against the floor-aligned
/// per-epoch entitlement in `_consumeClaimableMint`.
contract ERC7540EpochDepositFuzzTest is Test {
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

    // Two epochs so `maxMint(alice)` sums floor entitlements across epochs — the shape
    // that used to let a ceil-rounded `requested` in `_consumeClaimableMint` drain the
    // older epoch's `totalShares` to 0 while `totalAssets` stayed positive, freezing Bob
    // behind a Pending-looking epoch.
    function testFuzz_MintClaimPreservesFulfilledSentinel(
        uint128 rA1,
        uint128 rB1,
        uint128 fulfillS1,
        uint128 rA2,
        uint128 fulfillS2
    ) public {
        rA1 = uint128(bound(rA1, 1, 1e30));
        rB1 = uint128(bound(rB1, 1, 1e30));
        rA2 = uint128(bound(rA2, 1, 1e30));
        fulfillS1 = uint128(bound(fulfillS1, 1, 1e30));
        fulfillS2 = uint128(bound(fulfillS2, 1, 1e30));

        token.mint(ALICE, uint256(rA1) + rA2);
        token.mint(BOB, rB1);
        vm.startPrank(ALICE);
        token.approve(address(vault), type(uint256).max);
        vault.requestDeposit(rA1, ALICE, ALICE);
        vm.stopPrank();
        vm.startPrank(BOB);
        token.approve(address(vault), type(uint256).max);
        vault.requestDeposit(rB1, BOB, BOB);
        vm.stopPrank();

        uint256 epoch1 = vault.currentDepositEpoch();
        vm.warp(block.timestamp + WEEK);

        vm.prank(ALICE);
        vault.requestDeposit(rA2, ALICE, ALICE);
        uint256 epoch2 = vault.currentDepositEpoch();
        assertGt(epoch2, epoch1);

        vm.warp(block.timestamp + WEEK);
        vault.fulfillDeposit(epoch1, fulfillS1);
        vault.fulfillDeposit(epoch2, fulfillS2);

        uint256 tA1Before = vault.totalDepositAssets(epoch1);

        uint256 aliceMax = vault.maxMint(ALICE);
        if (aliceMax > 0) {
            vm.prank(ALICE);
            vault.mint(aliceMax, ALICE, ALICE);
        }

        // Sentinel invariant on epoch1: a fulfilled epoch cannot regress to the Pending
        // sentinel state (totalShares == 0) while assets remain in the pool.
        uint256 tA1 = vault.totalDepositAssets(epoch1);
        uint256 tS1 = vault.totalDepositShares(epoch1);
        assertFalse(tS1 == 0 && tA1 > 0, "epoch1 sentinel dirtied");

        // C-02 invariant on epoch1: Alice never consumed more assets from epoch1 than her
        // request in that epoch.
        assertLe(tA1Before - tA1, rA1, "epoch1 asset over-consumption");

        // Bob's claim slot on epoch1 stays reachable (matches `claimableDepositRequest`).
        assertEq(vault.claimableDepositRequest(epoch1, BOB), rB1);
    }

    // A mint that exhausts a controller's share entitlement in an epoch dequeues it and must consume
    // the entire asset request, leaving no residue behind the popped entry.
    function testFuzz_MintExhaustsRequest(uint128 rA, uint128 rB, uint128 fulfillS) public {
        rA = uint128(bound(rA, 1, 1e30));
        rB = uint128(bound(rB, 1, 1e30));
        fulfillS = uint128(bound(fulfillS, 1, 1e30));

        uint256 epoch = _requestAndFulfill(rA, rB, fulfillS);

        uint256 aliceMax = vault.maxMint(ALICE);
        vm.assume(aliceMax > 0);
        vm.prank(ALICE);
        vault.mint(aliceMax, ALICE, ALICE);

        assertEq(vault.depositEpochs(ALICE, 0, type(uint64).max).length, 0);
        assertEq(vault.claimableDepositRequest(epoch, ALICE), 0);
        assertEq(vault.maxDeposit(ALICE), 0);

        _claimAllAndCheckDrained(BOB, epoch);
    }

    // A partial mint must pay at least the pro-rata assets for the shares it receives (rounding in
    // favor of the vault), and the epoch must still drain completely afterwards.
    function testFuzz_PartialMintRoundsUp(uint128 rA, uint128 rB, uint128 fulfillS, uint256 shares) public {
        rA = uint128(bound(rA, 1, 1e30));
        rB = uint128(bound(rB, 1, 1e30));
        fulfillS = uint128(bound(fulfillS, 1, 1e30));

        uint256 epoch = _requestAndFulfill(rA, rB, fulfillS);

        uint256 aliceMax = vault.maxMint(ALICE);
        vm.assume(aliceMax > 1);
        shares = bound(shares, 1, aliceMax - 1);

        uint256 tA = vault.totalDepositAssets(epoch);
        uint256 tS = vault.totalDepositShares(epoch);

        vm.prank(ALICE);
        uint256 assets = vault.mint(shares, ALICE, ALICE);
        assertGe(assets * tS, shares * tA, "partial mint rounded in favor of caller");

        _claimAllAndCheckDrained(ALICE, epoch);
        _claimAllAndCheckDrained(BOB, epoch);
    }

    // A partial mint by the last claimant of an epoch can round up to its whole remaining request. The
    // shares left in the epoch can no longer be claimed, so they must be released to the vault.
    function test_LastPartialMintReleasesResidue() public {
        vault = new EpochVault(token, CUSTODY);

        token.mint(ALICE, 10);
        vm.startPrank(ALICE);
        token.approve(address(vault), type(uint256).max);
        vault.requestDeposit(10, ALICE, ALICE);
        vm.stopPrank();

        uint256 epoch = vault.currentDepositEpoch();
        vm.warp(block.timestamp + WEEK);
        vault.fulfillDeposit(epoch, 1000);
        assertEq(vault.balanceOf(CUSTODY), 1000);

        vm.prank(ALICE);
        assertEq(vault.mint(999, ALICE, ALICE), 10); // ceil(999 * 10 / 1000) consumes the whole request

        assertEq(vault.maxMint(ALICE), 0);
        assertEq(vault.totalDepositAssets(epoch), 0);
        assertEq(vault.totalDepositShares(epoch), 0);
        assertEq(vault.balanceOf(ALICE), 999);
        assertEq(vault.balanceOf(CUSTODY), 0);
        assertEq(vault.totalSupply(), 999);
        assertEq(vault.totalOutstandingShares(), 999);
    }

    // Whatever the claim order and custody model, once every controller has claimed, the epoch is
    // drained and no shares are left at the custody address.
    function testFuzz_LastPartialMintDrainsEpoch(
        uint128 rA,
        uint128 rB,
        uint128 fulfillS,
        uint256 shares,
        bool preMint
    ) public {
        vault = new EpochVault(token, preMint ? CUSTODY : address(0));

        rA = uint128(bound(rA, 1, 1e30));
        rB = uint128(bound(rB, 1, 1e30));
        fulfillS = uint128(bound(fulfillS, 1, 1e30));

        uint256 epoch = _requestAndFulfill(rA, rB, fulfillS);

        uint256 bobMax = vault.maxDeposit(BOB);
        if (bobMax > 0) {
            vm.prank(BOB);
            vault.deposit(bobMax, BOB, BOB);
        }

        uint256 aliceMax = vault.maxMint(ALICE);
        vm.assume(aliceMax > 1);
        shares = bound(shares, 1, aliceMax - 1);
        vm.prank(ALICE);
        vault.mint(shares, ALICE, ALICE);

        uint256 aliceRest = vault.maxDeposit(ALICE);
        if (aliceRest > 0) {
            vm.prank(ALICE);
            vault.deposit(aliceRest, ALICE, ALICE);
        }

        assertEq(vault.totalDepositAssets(epoch), 0, "epoch assets not drained");
        assertEq(vault.totalDepositShares(epoch), 0, "epoch shares not drained");
        assertEq(vault.totalPendingDepositAssets(), 0, "pending assets not drained");
        assertEq(vault.balanceOf(CUSTODY), 0, "shares left at custody");
        assertEq(vault.totalSupply(), vault.balanceOf(ALICE) + vault.balanceOf(BOB));
        assertEq(vault.totalOutstandingShares(), vault.totalSupply(), "claimable shares not released");
        assertEq(vault.totalAssets(), token.balanceOf(address(vault)), "claimable assets not released");
    }

    function _requestAndFulfill(uint256 rA, uint256 rB, uint256 fulfillS) internal returns (uint256 epoch) {
        token.mint(ALICE, rA);
        token.mint(BOB, rB);
        vm.startPrank(ALICE);
        token.approve(address(vault), type(uint256).max);
        vault.requestDeposit(rA, ALICE, ALICE);
        vm.stopPrank();
        vm.startPrank(BOB);
        token.approve(address(vault), type(uint256).max);
        vault.requestDeposit(rB, BOB, BOB);
        vm.stopPrank();

        epoch = vault.currentDepositEpoch();
        vm.warp(block.timestamp + WEEK);
        vault.fulfillDeposit(epoch, fulfillS);
    }

    function _claimAllAndCheckDrained(address controller, uint256 epoch) internal {
        uint256 max = vault.maxDeposit(controller);
        if (max > 0) {
            vm.prank(controller);
            vault.deposit(max, controller, controller);
        }
        assertEq(vault.depositEpochs(controller, 0, type(uint64).max).length, 0);
        if (controller == BOB) {
            assertEq(vault.totalDepositAssets(epoch), 0, "epoch assets not drained");
            assertEq(vault.totalDepositShares(epoch), 0, "epoch shares not drained");
            assertEq(vault.totalPendingDepositAssets(), 0, "pending assets not drained");
        }
    }
}
