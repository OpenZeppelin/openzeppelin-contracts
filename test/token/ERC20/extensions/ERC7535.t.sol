// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC7535} from "@openzeppelin/contracts/token/ERC20/extensions/ERC7535.sol";

/// @dev Concrete deployable ERC7535 vault with a configurable decimals offset.
contract ERC7535VaultMock is ERC7535 {
    uint8 private immutable _offset;

    constructor(uint8 offset_) ERC20("Native Vault", "nVLT") {
        _offset = offset_;
    }

    function _decimalsOffset() internal view virtual override returns (uint8) {
        return _offset;
    }
}

/// @dev Malicious share owner / receiver that attempts to reenter the vault on the ETH `sendValue` callback.
///
/// With the CEI-only design (no reentrancy guard, inherited from ERC4626), the reentrant call is NOT blocked by a
/// guard. Instead this receiver observes the vault's state *during* the outbound ETH push and attempts a second,
/// full-amount redeem of the very shares that triggered the payout. The tests prove that checks-effects-interactions
/// makes such a reentry harmless: the shares are already burned when the callback fires, so the receiver cannot
/// extract more than its shares entitled it to, and cannot drain other users.
contract ReentrantReceiver {
    enum Kind {
        None,
        Withdraw,
        Redeem
    }

    ERC7535VaultMock public vault;
    Kind public kind;
    uint256 public reenterShares; // shares the receiver tries to re-redeem during the callback

    bool public reentered;
    bool public reentryReverted;

    // State snapshot observed *inside* the reentrant callback (i.e. mid-`_withdraw`, after the burn).
    uint256 public observedSelfBalance;
    uint256 public observedTotalSupply;

    function setup(ERC7535VaultMock vault_, Kind kind_, uint256 reenterShares_) external {
        vault = vault_;
        kind = kind_;
        reenterShares = reenterShares_;
    }

    receive() external payable {
        if (kind == Kind.None) return;
        reentered = true;

        // Observe the vault state as seen by a reentrant party during the ETH push.
        observedSelfBalance = vault.balanceOf(address(this));
        observedTotalSupply = vault.totalSupply();

        // Attempt to re-extract the *same* shares again, mid-payout. CEI must make this fail (the shares were
        // already burned) or otherwise be unable to over-drain. We swallow the revert so the outer call can
        // complete and the test can assert the resulting accounting.
        try this.reenter() {
            reentryReverted = false;
        } catch {
            reentryReverted = true;
        }
    }

    function reenter() external {
        if (kind == Kind.Withdraw) {
            vault.withdraw(reenterShares, address(this), address(this));
        } else if (kind == Kind.Redeem) {
            vault.redeem(reenterShares, address(this), address(this));
        }
    }
}

contract ERC7535Test is Test {
    uint256 internal constant MAX_ETH = 1e27; // ~1B ETH worth of wei, keeps fuzz inputs realistic

    ERC7535VaultMock internal vault;

    address internal attacker = makeAddr("attacker");
    address internal victim = makeAddr("victim");
    address internal other = makeAddr("other");

    receive() external payable {}

    function setUp() public {
        vault = new ERC7535VaultMock(0);
    }

    // --------------------------------------------------------------------------------------------
    // Metadata / asset semantics
    // --------------------------------------------------------------------------------------------

    function testAssetSentinel() public view {
        assertEq(vault.asset(), 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    }

    function testFuzzDecimals(uint8 offset) public {
        // Bound across the full uint8 range so the fuzzer also exercises the documented overflow at
        // 18 + offset > 255 (i.e. offset >= 238), mirroring the ERC4626 decimals overflow assertion.
        offset = uint8(bound(offset, 0, 255));
        ERC7535VaultMock v = new ERC7535VaultMock(offset);
        if (uint256(18) + uint256(offset) > type(uint8).max) {
            // 0x11 is the Panic code for arithmetic over/underflow.
            vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x11));
            v.decimals();
        } else {
            assertEq(v.decimals(), uint256(18) + offset);
        }
    }

    function testTotalAssetsTracksBalance() public {
        assertEq(vault.totalAssets(), 0);
        vm.deal(address(vault), 5 ether);
        assertEq(vault.totalAssets(), 5 ether);
    }

    // --------------------------------------------------------------------------------------------
    // Decimals offset arithmetic ceiling: 10 ** offset overflows uint256 from offset 78 onwards,
    // tighter than the uint8 ceiling of 237 on decimals().
    // --------------------------------------------------------------------------------------------

    function testOffset77IsTheLargestWorkingOffset() public {
        ERC7535VaultMock v = new ERC7535VaultMock(77);

        assertEq(v.decimals(), 18 + 77);
        assertEq(v.previewDeposit(1), 10 ** 77);

        vm.deal(address(this), 1);
        uint256 minted = v.deposit{value: 1}(1, address(this));
        assertEq(minted, 10 ** 77);
    }

    function testOffset78BricksConversionsWithArithmeticPanic() public {
        // Deploys fine — the failure only surfaces on the first conversion-dependent call.
        ERC7535VaultMock v = new ERC7535VaultMock(78);

        vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x11));
        v.previewDeposit(1);

        vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x11));
        v.previewMint(1);

        vm.deal(address(this), 1);
        vm.expectRevert(abi.encodeWithSignature("Panic(uint256)", 0x11));
        v.deposit{value: 1}(1, address(this));
    }

    // --------------------------------------------------------------------------------------------
    // msg.value enforcement (>= policy: underpayment reverts, exact and overpayment succeed)
    // --------------------------------------------------------------------------------------------

    function testFuzzDepositRevertsWhenValueBelowAssets(uint256 assets, uint256 value) public {
        assets = bound(assets, 1, MAX_ETH);
        value = bound(value, 0, assets - 1);
        vm.deal(address(this), value);
        vm.expectRevert(abi.encodeWithSelector(ERC7535.ERC7535InsufficientNativeValue.selector, value, assets));
        vault.deposit{value: value}(assets, victim);
    }

    function testFuzzMintRevertsWhenValueBelowCost(uint256 shares, uint256 value) public {
        shares = bound(shares, 1, MAX_ETH);
        uint256 cost = vault.previewMint(shares); // empty vault, queried before sending value
        vm.assume(cost > 0);
        value = bound(value, 0, cost - 1);
        vm.deal(address(this), value);
        vm.expectRevert(abi.encodeWithSelector(ERC7535.ERC7535InsufficientNativeValue.selector, value, cost));
        vault.mint{value: value}(shares, victim);
    }

    function testFuzzDepositOverpaymentIsDonation(uint256 assets, uint256 extra) public {
        assets = bound(assets, 0, MAX_ETH);
        extra = bound(extra, 0, MAX_ETH);

        // Empty vault: shares are priced on `assets`, not on the in-flight value.
        uint256 previewed = vault.previewDeposit(assets);

        vm.deal(attacker, assets + extra);
        vm.prank(attacker);
        uint256 minted = vault.deposit{value: assets + extra}(assets, attacker);

        assertEq(minted, previewed, "overpayment changed the minted shares");
        assertEq(vault.balanceOf(attacker), previewed);
        // The full msg.value entered the vault; the excess is an unminted donation.
        assertEq(vault.totalAssets(), assets + extra, "vault did not retain the full msg.value");
    }

    // --------------------------------------------------------------------------------------------
    // previewDeposit (queried standalone, before value is sent) == shares actually minted.
    // This is the msg.value / totalAssets correctness property.
    // --------------------------------------------------------------------------------------------

    function testFuzzPreviewDepositEqualsMinted(uint256 seed, uint256 assets) public {
        // Seed the vault with some real balance and supply so totalAssets() and totalSupply() are non-trivial.
        seed = bound(seed, 0, MAX_ETH);
        if (seed != 0) {
            vm.deal(address(this), seed);
            vault.deposit{value: seed}(seed, other);
        }

        assets = bound(assets, 0, MAX_ETH);

        // Off-chain preview MUST be computed before sending value (view cannot see in-flight msg.value).
        uint256 previewed = vault.previewDeposit(assets);

        vm.deal(attacker, assets);
        vm.prank(attacker);
        uint256 minted = vault.deposit{value: assets}(assets, attacker);

        assertEq(minted, previewed, "previewDeposit != minted shares");
        assertEq(vault.balanceOf(attacker), previewed);
    }

    function testFuzzPreviewMintEqualsActualCost(uint256 seed, uint256 shares) public {
        seed = bound(seed, 0, MAX_ETH);
        if (seed != 0) {
            vm.deal(address(this), seed);
            vault.deposit{value: seed}(seed, other);
        }

        shares = bound(shares, 0, 1e24);
        uint256 cost = vault.previewMint(shares);
        vm.assume(cost <= MAX_ETH);

        vm.deal(attacker, cost);
        vm.prank(attacker);
        uint256 actual = vault.mint{value: cost}(shares, attacker);

        assertEq(actual, cost, "mint returned assets != previewMint");
        assertEq(vault.balanceOf(attacker), shares);
    }

    // --------------------------------------------------------------------------------------------
    // Inflation / donation attack non-profitability at offset 0 (force-feed via vm.deal)
    // --------------------------------------------------------------------------------------------

    function testFuzzInflationAttackNotProfitable(uint256 donation, uint256 victimDeposit) public {
        donation = bound(donation, 0, MAX_ETH);
        victimDeposit = bound(victimDeposit, 1, MAX_ETH);

        // 1. Attacker makes the canonical 1 wei first deposit.
        vm.deal(attacker, 1);
        vm.prank(attacker);
        vault.deposit{value: 1}(1, attacker);
        uint256 attackerShares = vault.balanceOf(attacker);

        // 2. Attacker force-feeds a donation directly into the vault balance (SELFDESTRUCT/coinbase analogue).
        vm.deal(address(vault), address(vault).balance + donation);
        uint256 attackerSpent = 1 + donation;

        // 3. Victim deposits.
        vm.deal(victim, victimDeposit);
        vm.prank(victim);
        vault.deposit{value: victimDeposit}(victimDeposit, victim);

        // 4. Attacker redeems everything they hold.
        uint256 attackerPayout = vault.previewRedeem(attackerShares);

        // Property: at offset 0 the attacker can never come out ahead of what they put in.
        assertLe(attackerPayout, attackerSpent, "inflation attack was profitable at offset 0");
    }

    // --------------------------------------------------------------------------------------------
    // Round-trips: a user never extracts more than they put in.
    // --------------------------------------------------------------------------------------------

    function testFuzzDepositRedeemRoundTrip(uint256 seed, uint256 assets) public {
        seed = bound(seed, 0, MAX_ETH);
        if (seed != 0) {
            vm.deal(address(this), seed);
            vault.deposit{value: seed}(seed, other);
        }

        assets = bound(assets, 0, MAX_ETH);
        vm.deal(victim, assets);
        vm.prank(victim);
        uint256 shares = vault.deposit{value: assets}(assets, victim);

        vm.prank(victim);
        uint256 redeemed = vault.redeem(shares, victim, victim);

        assertLe(redeemed, assets, "deposit->redeem extracted more than deposited");
    }

    function testFuzzMintRedeemRoundTrip(uint256 seed, uint256 shares) public {
        seed = bound(seed, 0, MAX_ETH);
        if (seed != 0) {
            vm.deal(address(this), seed);
            vault.deposit{value: seed}(seed, other);
        }

        shares = bound(shares, 0, 1e24);
        uint256 cost = vault.previewMint(shares);
        vm.assume(cost <= MAX_ETH);

        vm.deal(victim, cost);
        vm.prank(victim);
        vault.mint{value: cost}(shares, victim);

        vm.prank(victim);
        uint256 redeemed = vault.redeem(shares, victim, victim);

        assertLe(redeemed, cost, "mint->redeem extracted more than paid");
    }

    // --------------------------------------------------------------------------------------------
    // convertToShares ∘ convertToAssets is a contraction (rounding favors the vault).
    // --------------------------------------------------------------------------------------------

    function testFuzzConvertRoundTripContraction(uint256 seed, uint256 shares) public {
        seed = bound(seed, 0, MAX_ETH);
        if (seed != 0) {
            vm.deal(address(this), seed);
            vault.deposit{value: seed}(seed, other);
        }

        shares = bound(shares, 0, vault.totalSupply() == 0 ? MAX_ETH : vault.totalSupply());

        uint256 assets = vault.convertToAssets(shares);
        uint256 backToShares = vault.convertToShares(assets);

        assertLe(backToShares, shares, "convertToShares(convertToAssets(s)) > s: rounding favored user");
    }

    function testFuzzConvertAssetsRoundTripContraction(uint256 seed, uint256 assets) public {
        seed = bound(seed, 1, MAX_ETH);
        vm.deal(address(this), seed);
        vault.deposit{value: seed}(seed, other);

        assets = bound(assets, 0, MAX_ETH);

        uint256 shares = vault.convertToShares(assets);
        uint256 backToAssets = vault.convertToAssets(shares);

        assertLe(backToAssets, assets, "convertToAssets(convertToShares(a)) > a: rounding favored user");
    }

    // --------------------------------------------------------------------------------------------
    // Force-fed ETH does not break accounting (view functions still answer, withdraw still works).
    // --------------------------------------------------------------------------------------------

    function testFuzzForceFedEthDoesNotBreakAccounting(uint256 deposit, uint256 forceFed) public {
        deposit = bound(deposit, 1, MAX_ETH);
        forceFed = bound(forceFed, 0, MAX_ETH);

        vm.deal(victim, deposit);
        vm.prank(victim);
        uint256 shares = vault.deposit{value: deposit}(deposit, victim);

        // Force-feed extra ETH that mints no shares.
        vm.deal(address(vault), address(vault).balance + forceFed);

        assertEq(vault.totalAssets(), deposit + forceFed);
        assertEq(vault.totalSupply(), shares);

        // Victim can still redeem; payout is well-defined and never reverts.
        uint256 expected = vault.previewRedeem(shares);
        vm.prank(victim);
        uint256 redeemed = vault.redeem(shares, victim, victim);
        assertEq(redeemed, expected);
    }

    // --------------------------------------------------------------------------------------------
    // Reentrancy (CEI-only, no guard): a malicious receiver that reenters withdraw/redeem during the
    // ETH `sendValue` push MUST NOT (a) extract more native asset than its shares entitle it to, or
    // (b) drain other users' funds. `_withdraw` (inherited from ERC4626) burns shares BEFORE the
    // outbound transfer, so the reentrant call observes an already-reduced state.
    // --------------------------------------------------------------------------------------------

    function _fundReceiver(ReentrantReceiver r, uint256 deposit) internal returns (uint256 shares) {
        vm.deal(address(r), deposit);
        vm.prank(address(r));
        shares = vault.deposit{value: deposit}(deposit, address(r));
    }

    function _assertReentrancyCEI(ReentrantReceiver.Kind kind) internal {
        ReentrantReceiver r = new ReentrantReceiver();

        // Seed a second, honest depositor so the vault holds extra ETH the attacker could try to steal.
        uint256 otherDeposit = 10 ether;
        vm.deal(other, otherDeposit);
        vm.prank(other);
        uint256 otherShares = vault.deposit{value: otherDeposit}(otherDeposit, other);

        // Attacker becomes a share owner.
        uint256 attackerDeposit = 5 ether;
        uint256 attackerShares = _fundReceiver(r, attackerDeposit);

        // The attacker will try to re-redeem its FULL share balance again during the payout callback.
        r.setup(vault, kind, attackerShares);

        uint256 vaultBalBefore = address(vault).balance;
        uint256 totalSupplyBefore = vault.totalSupply();
        uint256 expectedPayout = vault.previewRedeem(attackerShares);

        vm.prank(address(r));
        vault.redeem(attackerShares, address(r), address(r));

        assertTrue(r.reentered(), "callback never fired");

        // CEI: shares are burned BEFORE the ETH send, so the reentrant party observes zero balance for
        // itself and a totalSupply already reduced by exactly its shares.
        assertEq(r.observedSelfBalance(), 0, "attacker shares not burned before ETH send (CEI violated)");
        assertEq(
            r.observedTotalSupply(),
            totalSupplyBefore - attackerShares,
            "totalSupply not reduced before ETH send (CEI violated)"
        );

        // (a) No over-extraction.
        assertEq(
            address(r).balance,
            expectedPayout,
            "attacker extracted more native asset than its shares entitled it to"
        );

        // (b) No drain of other users.
        assertEq(address(vault).balance, vaultBalBefore - expectedPayout, "vault over-drained");
        assertGe(
            address(vault).balance,
            vault.previewRedeem(otherShares),
            "vault cannot honor the honest depositor after the reentrant attempt (insolvent)"
        );

        assertEq(vault.balanceOf(address(r)), 0, "attacker still holds shares");
        assertEq(vault.totalSupply(), otherShares, "share supply inconsistent after attack");

        // The honest depositor can still fully withdraw afterwards (funds not bricked).
        uint256 otherPayout = vault.previewRedeem(otherShares);
        vm.prank(other);
        uint256 redeemed = vault.redeem(otherShares, other, other);
        assertEq(redeemed, otherPayout, "honest depositor could not redeem after attack");
    }

    function testReentrancyWithdrawCannotOverDrain() public {
        _assertReentrancyCEI(ReentrantReceiver.Kind.Withdraw);
    }

    function testReentrancyRedeemCannotOverDrain() public {
        _assertReentrancyCEI(ReentrantReceiver.Kind.Redeem);
    }

    // --------------------------------------------------------------------------------------------
    // Plain native-asset transfers hit receive() and MUST revert with ERC7535UnsolicitedDeposit.
    // Force-feeding via SELFDESTRUCT / coinbase / vm.deal bypasses the EVM code path and still works
    // (totalAssets rises) — the documented limitation the inflation-attack analysis accounts for.
    // --------------------------------------------------------------------------------------------

    function testPlainEthTransferRevertsWithUnsolicitedDeposit() public {
        address sender = makeAddr("plainSender");
        vm.deal(sender, 1 ether);

        uint256 totalAssetsBefore = vault.totalAssets();
        uint256 vaultBalBefore = address(vault).balance;

        vm.prank(sender);
        (bool ok, bytes memory ret) = address(vault).call{value: 1}("");

        assertFalse(ok, "plain ETH transfer to vault should fail");
        assertEq(
            bytes4(ret),
            ERC7535.ERC7535UnsolicitedDeposit.selector,
            "revert selector should be ERC7535UnsolicitedDeposit"
        );

        assertEq(address(vault).balance, vaultBalBefore, "vault balance changed despite revert");
        assertEq(vault.totalAssets(), totalAssetsBefore, "totalAssets changed despite revert");
        assertEq(sender.balance, 1 ether, "sender lost ETH despite revert");

        // Force-feeding via vm.deal (the SELFDESTRUCT / coinbase analogue) bypasses receive() and still raises
        // totalAssets — documented limitation of the receive() guard.
        uint256 forceFed = 7 ether;
        vm.deal(address(vault), vaultBalBefore + forceFed);
        assertEq(vault.totalAssets(), totalAssetsBefore + forceFed, "force-feed via vm.deal did not raise totalAssets");
    }

    // --------------------------------------------------------------------------------------------
    // Allowance path: third-party redeem must spend share allowance and cannot move another's shares.
    // --------------------------------------------------------------------------------------------

    function testThirdPartyRedeemRequiresAllowance() public {
        vm.deal(victim, 3 ether);
        vm.prank(victim);
        uint256 shares = vault.deposit{value: 3 ether}(3 ether, victim);

        // attacker has no allowance over victim's shares.
        vm.prank(attacker);
        vm.expectRevert();
        vault.redeem(shares, attacker, victim);

        // With allowance, it succeeds and burns exactly `shares` worth.
        vm.prank(victim);
        vault.approve(attacker, shares);
        vm.prank(attacker);
        vault.redeem(shares, attacker, victim);
        assertEq(vault.balanceOf(victim), 0);
    }

    // --------------------------------------------------------------------------------------------
    // Outbound send failure: a receiver whose receive() reverts must bubble the failure and roll back.
    // --------------------------------------------------------------------------------------------

    function testFuzzWithdrawToRevertingReceiverReverts(uint256 assets) public {
        assets = bound(assets, 1, MAX_ETH);
        vm.deal(victim, assets);
        vm.prank(victim);
        vault.deposit{value: assets}(assets, victim);

        RevertingReceiver rj = new RevertingReceiver();

        uint256 balanceBefore = address(vault).balance;
        uint256 supplyBefore = vault.totalSupply();
        uint256 sharesBefore = vault.balanceOf(victim);

        vm.prank(victim);
        vm.expectRevert();
        vault.withdraw(assets, address(rj), victim);

        assertEq(address(vault).balance, balanceBefore, "balance changed on a reverted withdraw");
        assertEq(vault.totalSupply(), supplyBefore, "totalSupply changed on a reverted withdraw");
        assertEq(vault.balanceOf(victim), sharesBefore, "shares changed on a reverted withdraw");
    }
}

/// @dev Receiver whose `receive` always reverts — used to drive `Address.sendValue` into its failure branch.
contract RevertingReceiver {
    receive() external payable {
        revert("nope");
    }
}

// =================================================================================================
// Invariant test: a handler that randomly deposits / withdraws / donates / redeems, with the core
// solvency and no-profit invariants asserted on top.
// =================================================================================================

contract ERC7535Handler is Test {
    ERC7535VaultMock public vault;

    address[] public actors;
    mapping(address => uint256) public netInvested; // sum(deposits) − sum(redeemPayouts)
    uint256 public totalDonated;

    constructor(ERC7535VaultMock vault_, address[] memory actors_) {
        vault = vault_;
        actors = actors_;
    }

    function _pickActor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function handlerDeposit(uint256 seed, uint256 assets) external {
        address actor = _pickActor(seed);
        assets = bound(assets, 0, 1e22);
        vm.deal(actor, actor.balance + assets);
        vm.prank(actor);
        vault.deposit{value: assets}(assets, actor);
        netInvested[actor] += assets;
    }

    function handlerRedeem(uint256 seed, uint256 shares) external {
        address actor = _pickActor(seed);
        uint256 maxShares = vault.maxRedeem(actor);
        if (maxShares == 0) return;
        shares = bound(shares, 0, maxShares);
        uint256 balBefore = actor.balance;
        vm.prank(actor);
        vault.redeem(shares, actor, actor);
        uint256 payout = actor.balance - balBefore;
        if (payout >= netInvested[actor]) {
            netInvested[actor] = 0;
        } else {
            netInvested[actor] -= payout;
        }
    }

    function handlerDonate(uint256 amount) external {
        amount = bound(amount, 0, 1e18);
        // Force-feed (SELFDESTRUCT/coinbase analogue): raises balance without minting shares.
        vm.deal(address(vault), address(vault).balance + amount);
        totalDonated += amount;
    }

    function sumNetInvested() external view returns (uint256 sum) {
        for (uint256 i; i < actors.length; ++i) sum += netInvested[actors[i]];
    }
}

contract ERC7535InvariantTest is Test {
    ERC7535VaultMock internal vault;
    ERC7535Handler internal handler;
    address[] internal actors;

    function setUp() public {
        vault = new ERC7535VaultMock(0);

        actors = new address[](3);
        actors[0] = makeAddr("alice");
        actors[1] = makeAddr("bob");
        actors[2] = makeAddr("carol");

        handler = new ERC7535Handler(vault, actors);

        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = handler.handlerDeposit.selector;
        selectors[1] = handler.handlerRedeem.selector;
        selectors[2] = handler.handlerDonate.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    /// @dev Solvency: the vault's native balance must always cover what every holder could redeem RIGHT NOW.
    function invariantSolvency() public view {
        uint256 owed = 0;
        for (uint256 i; i < actors.length; ++i) {
            owed += vault.previewRedeem(vault.balanceOf(actors[i]));
        }
        assertGe(address(vault).balance, owed, "vault balance < sum(previewRedeem(holders))");
    }

    /// @dev No value creation: redeemable assets across holders are bounded by deposits + donations.
    function invariantNoValueCreation() public view {
        uint256 redeemable = 0;
        for (uint256 i; i < actors.length; ++i) {
            redeemable += vault.previewRedeem(vault.balanceOf(actors[i]));
        }
        assertLe(
            redeemable,
            handler.sumNetInvested() + handler.totalDonated(),
            "holders can extract more than was put in"
        );
    }
}
