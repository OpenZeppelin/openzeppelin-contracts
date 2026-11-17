// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ERC7540} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540.sol";
import {ERC7540AdminDeposit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540AdminDeposit.sol";
import {ERC7540AdminRedeem} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540AdminRedeem.sol";
import {ERC7540EpochDeposit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540EpochDeposit.sol";
import {ERC7540EpochRedeem} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540EpochRedeem.sol";
import {ERC7540SyncDeposit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540SyncDeposit.sol";
import {ERC7540SyncRedeem} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7540SyncRedeem.sol";

abstract contract CustodyMock is ERC7540 {
    address private immutable _custody;

    constructor(address custody) {
        _custody = custody;
    }

    function _depositShareOrigin() internal view virtual override returns (address) {
        return _custody;
    }

    function _redeemShareDestination() internal view virtual override returns (address) {
        return _custody;
    }
}

interface IAsyncDepositFulfiller {
    function fulfill(uint256 requestId, address controller, uint256 assets, uint256 shares) external;
}

interface IAsyncRedeemFulfiller {
    function fulfill(uint256 requestId, address controller, uint256 shares, uint256 assets) external;
}

contract EpochDepositSyncRedeem is CustodyMock, ERC7540EpochDeposit, ERC7540SyncRedeem, IAsyncDepositFulfiller {
    constructor(IERC20 asset_, address custody) ERC20("Vault", "VLT") ERC7540(asset_) CustodyMock(custody) {}

    function fulfill(uint256 requestId, address, uint256, uint256 shares) external {
        _fulfillDeposit(requestId, shares);
    }

    function _requestDeposit(
        uint256 assets,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540EpochDeposit) {
        super._requestDeposit(assets, controller, owner, requestId);
    }

    function _depositShareOrigin() internal view virtual override(ERC7540, CustodyMock) returns (address) {
        return super._depositShareOrigin();
    }

    function _redeemShareDestination() internal view virtual override(ERC7540, CustodyMock) returns (address) {
        return super._redeemShareDestination();
    }
}

contract AdminDepositSyncRedeem is CustodyMock, ERC7540AdminDeposit, ERC7540SyncRedeem, IAsyncDepositFulfiller {
    constructor(IERC20 asset_, address custody) ERC20("Vault", "VLT") ERC7540(asset_) CustodyMock(custody) {}

    function fulfill(uint256, address controller, uint256 assets, uint256 shares) external {
        _fulfillDeposit(assets, shares, controller);
    }

    function _requestDeposit(
        uint256 assets,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540AdminDeposit) {
        super._requestDeposit(assets, controller, owner, requestId);
    }

    function _depositShareOrigin() internal view virtual override(ERC7540, CustodyMock) returns (address) {
        return super._depositShareOrigin();
    }

    function _redeemShareDestination() internal view virtual override(ERC7540, CustodyMock) returns (address) {
        return super._redeemShareDestination();
    }
}

contract SyncDepositEpochRedeem is CustodyMock, ERC7540SyncDeposit, ERC7540EpochRedeem, IAsyncRedeemFulfiller {
    constructor(IERC20 asset_, address custody) ERC20("Vault", "VLT") ERC7540(asset_) CustodyMock(custody) {}

    function fulfill(uint256 requestId, address, uint256, uint256 assets) external {
        _fulfillRedeem(requestId, assets);
    }

    function _requestRedeem(
        uint256 shares,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540EpochRedeem) {
        super._requestRedeem(shares, controller, owner, requestId);
    }

    function _depositShareOrigin() internal view virtual override(ERC7540, CustodyMock) returns (address) {
        return super._depositShareOrigin();
    }

    function _redeemShareDestination() internal view virtual override(ERC7540, CustodyMock) returns (address) {
        return super._redeemShareDestination();
    }
}

contract SyncDepositAdminRedeem is CustodyMock, ERC7540SyncDeposit, ERC7540AdminRedeem, IAsyncRedeemFulfiller {
    constructor(IERC20 asset_, address custody) ERC20("Vault", "VLT") ERC7540(asset_) CustodyMock(custody) {}

    function fulfill(uint256, address controller, uint256 shares, uint256 assets) external {
        _fulfillRedeem(shares, assets, controller);
    }

    function _requestRedeem(
        uint256 shares,
        address controller,
        address owner,
        uint256 requestId
    ) internal virtual override(ERC7540, ERC7540AdminRedeem) {
        super._requestRedeem(shares, controller, owner, requestId);
    }

    function _depositShareOrigin() internal view virtual override(ERC7540, CustodyMock) returns (address) {
        return super._depositShareOrigin();
    }

    function _redeemShareDestination() internal view virtual override(ERC7540, CustodyMock) returns (address) {
        return super._redeemShareDestination();
    }
}

/// @dev When an async module that locks the rate at fulfillment is combined with a sync module, requests that
/// are fulfilled but not yet claimed must be priced as settled. Otherwise the sync side trades at a rate that
/// ignores (deposit) or mis-values (redeem) them, and value moves between holders depending on claim timing.
contract ERC7540SyncMixedTest is Test {
    ERC20Mock internal token;

    address internal constant ALICE = address(0xA11CE); // existing holder
    address internal constant BOB = address(0xB0B); // async side
    address internal constant CAROL = address(0xCA201); // sync side
    address internal constant CUSTODY = address(0xdead);

    function setUp() public {
        token = new ERC20Mock();
    }

    function testEpochDepositSyncRedeem() public {
        _testAsyncDepositSyncRedeem(ERC7540(address(new EpochDepositSyncRedeem(token, address(0)))));
        _testAsyncDepositSyncRedeem(ERC7540(address(new EpochDepositSyncRedeem(token, CUSTODY))));
    }

    function testAdminDepositSyncRedeem() public {
        _testAsyncDepositSyncRedeem(ERC7540(address(new AdminDepositSyncRedeem(token, address(0)))));
        _testAsyncDepositSyncRedeem(ERC7540(address(new AdminDepositSyncRedeem(token, CUSTODY))));
    }

    function testSyncDepositEpochRedeem() public {
        _testSyncDepositAsyncRedeem(ERC7540(address(new SyncDepositEpochRedeem(token, address(0)))));
        _testSyncDepositAsyncRedeem(ERC7540(address(new SyncDepositEpochRedeem(token, CUSTODY))));
    }

    function testSyncDepositAdminRedeem() public {
        _testSyncDepositAsyncRedeem(ERC7540(address(new SyncDepositAdminRedeem(token, address(0)))));
        _testSyncDepositAsyncRedeem(ERC7540(address(new SyncDepositAdminRedeem(token, CUSTODY))));
    }

    // Alice holds 1000 shares (1:1). Bob's 1000-asset request is fulfilled at 1000 shares, so Bob owns half of
    // the vault from that point. Yield of 1000 then arrives before Bob claims: it must be split evenly.
    function _testAsyncDepositSyncRedeem(ERC7540 vault) internal {
        _asyncDeposit(vault, ALICE, 1000, 1000, true);
        uint256 requestId = _asyncDeposit(vault, BOB, 1000, 1000, false);

        token.mint(address(vault), 1000);

        vm.prank(ALICE);
        uint256 aliceOut = vault.redeem(1000, ALICE, ALICE);
        assertApproxEqAbs(aliceOut, 1500, 1, "alice captured bob's share of the yield");

        uint256 maxDeposit = vault.maxDeposit(BOB);
        vm.prank(BOB);
        vault.deposit(maxDeposit, BOB, BOB);
        assertApproxEqAbs(vault.convertToAssets(vault.balanceOf(BOB)), 1500, 1, "bob missed his share of the yield");
        assertEq(vault.claimableDepositRequest(requestId, BOB), 0);
    }

    // Alice and Bob hold 1000 shares each (1:1). Bob's redeem is fulfilled at 1000 assets, so his payout is fixed.
    // Yield of 1000 then arrives before Bob claims: it belongs entirely to Alice, and Carol must enter at the fair
    // price of 2 assets per share.
    function _testSyncDepositAsyncRedeem(ERC7540 vault) internal {
        _syncDeposit(vault, ALICE, 1000);
        _syncDeposit(vault, BOB, 1000);

        vm.prank(BOB);
        uint256 requestId = vault.requestRedeem(1000, BOB, BOB);
        _warpPastEpoch();
        IAsyncRedeemFulfiller(address(vault)).fulfill(requestId, BOB, 1000, 1000);

        token.mint(address(vault), 1000);
        assertApproxEqAbs(vault.convertToAssets(1000), 2000, 1, "sync price ignores the locked redeem");

        uint256 carolShares = _syncDeposit(vault, CAROL, 1500);

        vm.prank(BOB);
        assertEq(vault.redeem(1000, BOB, BOB), 1000);

        assertApproxEqAbs(vault.convertToAssets(1000), 2000, 1, "alice diluted");
        assertApproxEqAbs(vault.convertToAssets(carolShares), 1500, 1, "carol captured alice's yield");
    }

    function _asyncDeposit(
        ERC7540 vault,
        address user,
        uint256 assets,
        uint256 shares,
        bool claim
    ) internal returns (uint256 requestId) {
        token.mint(user, assets);
        vm.startPrank(user);
        token.approve(address(vault), assets);
        requestId = vault.requestDeposit(assets, user, user);
        vm.stopPrank();

        _warpPastEpoch();
        IAsyncDepositFulfiller(address(vault)).fulfill(requestId, user, assets, shares);

        if (claim) {
            vm.prank(user);
            vault.deposit(assets, user, user);
        }
    }

    function _syncDeposit(ERC7540 vault, address user, uint256 assets) internal returns (uint256) {
        token.mint(user, assets);
        vm.startPrank(user);
        token.approve(address(vault), assets);
        uint256 shares = vault.deposit(assets, user);
        vm.stopPrank();
        return shares;
    }

    function _warpPastEpoch() internal {
        vm.warp(block.timestamp + 7 days);
    }
}
