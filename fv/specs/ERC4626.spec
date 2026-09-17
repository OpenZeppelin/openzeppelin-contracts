// Two configs verify this file. ERC4626_split.conf takes depositIsNotSplittable, which needs tuned
// solver settings for nonlinear share math; ERC4626.conf excludes the three anti-splitting rules and
// runs everything else, so a rule added here runs without being named anywhere. The other two
// anti-splitting rules are excluded from both and carry a note of their own.
//
// Every config sets rule_sanity, so no rule here needs a hand-written reachability guard.
//
// P1 (solvency) lives in ERC4626Offset.spec, where the decimals offset is symbolic.

import "ERC4626Base.spec";
import "helpers/erc20-supply.spec";

// Checks that every contract function has at least one non-reverting path. A function that always
// reverts makes every rule calling it vacuous, with no `require` involved.
use builtin rule sanity;

// Proves the imported sum-of-balances invariant here, rather than only assuming it.
use invariant totalSupplyIsSumOfBalances;

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P2: round trips never create value, and per-operation leakage is at most one unit                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// The no-free-money half. Both directions of a round trip are stated on the preview functions, so
/// this holds for every state rather than only the ones a deposit could reach.
rule roundTripNeverCreatesValue(uint256 assets) {
    require sane();

    // Deposit then redeem never returns more than was put in.
    assert previewRedeem(previewDeposit(assets)) <= assets;
    // Withdraw then re-mint never costs less than was taken out.
    assert previewMint(previewWithdraw(assets)) >= assets;
}

/// The tightness half. Bounding leakage at one unit catches a preview override whose rounding
/// direction is transposed, which ERC4626 warns about: overrides to the deposit or withdraw
/// mechanism must be reflected in the preview functions.
///
/// previewWithdraw and previewDeposit are the same conversion at Ceil and Floor, as are previewMint
/// and previewRedeem, so each gap is a ceil-minus-floor and lands in {0, 1}.
rule roundingGapIsAtMostOne(uint256 assets, uint256 shares) {
    require sane();

    mathint depositGap = previewWithdraw(assets) - previewDeposit(assets);
    mathint mintGap    = previewMint(shares)     - previewRedeem(shares);

    assert depositGap >= 0 && depositGap <= 1;
    assert mintGap    >= 0 && mintGap    <= 1;
}

/// Witnesses that the bounds above are reachable. Mandatory: `assert gap <= 1` is trivially true of
/// a gap that is always zero, and rule_sanity cannot flag it because the assertion is reached. Kept
/// as separate rules so neither witness can be weakened by sharing a path with the other.
rule depositGapCanBeOne(uint256 assets) {
    require sane();
    satisfy previewWithdraw(assets) - previewDeposit(assets) == 1;
}

rule mintGapCanBeOne(uint256 shares) {
    require sane();
    satisfy previewMint(shares) - previewRedeem(shares) == 1;
}

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P3: the max/preview boundary - what the limits promise, the operations honour                      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// maxWithdraw floors on the way out while previewWithdraw ceils on the way back, so it is not
/// obvious the round trip stays inside the owner's share balance. It does: m = floor(b(A+1)/(T+K))
/// gives m(T+K)/(A+1) <= b, and b is an integer, so ceil(m(T+K)/(A+1)) <= b. That is what keeps
/// withdraw(maxWithdraw(o)) from reverting on the burn, which is why the third assertion carries
/// the weight of P3.
rule maxBoundaryIsConsistent(address owner) {
    require sane();
    requireInvariant totalSupplyIsSumOfBalances();

    assert maxRedeem(owner) == balanceOf(owner);
    assert maxWithdraw(owner) == previewRedeem(maxRedeem(owner));
    assert previewWithdraw(maxWithdraw(owner)) <= balanceOf(owner);
}

/// Liveness: the advertised limit is actually reachable. No invariant catches this - a max() that
/// over-promises leaves every value rule green while the operation reverts.
///
/// Both rules fix owner == msg.sender, so no allowance is spent and the claim is narrowed to
/// self-withdrawals; the allowance path belongs to the conservation rules. msg.sender must be
/// nonzero because burning from the zero address reverts regardless of amount.
///
/// noVirtualOverflow is stated on both, though only redeem needs it to pass: withdraw reaches the
/// same state through maxWithdraw, whose own revert prunes the path before the assertion. Assuming
/// it explicitly keeps the two rules covering the same states.
rule redeemMaxNeverReverts(env e, address receiver) {
    require sane();
    require nonpayable(e);
    require nonzerosender(e);
    require noVirtualOverflow();
    requireInvariant totalSupplyIsSumOfBalances();

    address owner = e.msg.sender;
    redeem@withrevert(e, maxRedeem(owner), receiver, owner);
    assert !lastReverted;
}

rule withdrawMaxNeverReverts(env e, address receiver) {
    require sane();
    require nonpayable(e);
    require nonzerosender(e);
    require noVirtualOverflow();
    requireInvariant totalSupplyIsSumOfBalances();

    address owner = e.msg.sender;
    withdraw@withrevert(e, maxWithdraw(owner), receiver, owner);
    assert !lastReverted;
}

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P4: splitting an operation into steps never beats doing it in one                                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// Three details carry this rule. The observable is the credited share balance rather than the
/// return value, which is what catches "returned the right number, booked the wrong one". The
/// inequality direction is derived from the rounding mode: previewDeposit floors, so a credit rounds
/// down and the one-shot call must not pay out less than the split. And the combined amount uses
/// assert_uint256, not require_uint256, so an overflowing sum fails the rule instead of being
/// assumed away - that boundary is where a splitting attack would live.
///
/// Both histories start from the same snapshot, so the receiver's pre-existing balance cancels and
/// comparing absolute balances is sound.
rule depositIsNotSplittable(env e, uint256 x, uint256 y, address receiver) {
    require sane();
    require nonpayable(e);
    require noVirtualOverflow();
    require receiver != 0 && e.msg.sender != currentContract;
    requireInvariant totalSupplyIsSumOfBalances();

    storage init = lastStorage;

    deposit(e, x, receiver);
    deposit(e, y, receiver);
    mathint split = balanceOf(receiver);

    deposit(e, assert_uint256(x + y), receiver) at init;
    mathint combined = balanceOf(receiver);

    assert  combined >= split;   // credit rounds down => one step favours the depositor
    satisfy combined >  split;   // ... and it actually bites somewhere
}

/// The mirror. previewWithdraw ceils, so shares burned round up and two burns overcharge by more
/// than one: the split must never burn fewer shares than the one-shot. Burning more leaves less, so
/// in terms of the remaining balance the direction is the same as deposit.
///
/// NOT DISCHARGED: excluded from every config, see the
/// [timeout ledger](../../.github/workflows/fv-certora.yml).
rule withdrawIsNotSplittable(env e, uint256 x, uint256 y, address receiver) {
    require sane();
    require nonpayable(e);
    require noVirtualOverflow();
    require nonzerosender(e);
    require receiver != 0 && receiver != currentContract && e.msg.sender != currentContract;
    requireInvariant totalSupplyIsSumOfBalances();

    address owner = e.msg.sender;
    storage init = lastStorage;

    withdraw(e, x, receiver, owner);
    withdraw(e, y, receiver, owner);
    mathint split = balanceOf(owner);

    withdraw(e, assert_uint256(x + y), receiver, owner) at init;
    mathint combined = balanceOf(owner);

    assert  combined >= split;
    satisfy combined >  split;
}

/// The variant only a donation model can express. Both histories spend the same x + y + d assets;
/// only the ordering differs.
///
/// The baseline is depositing up front, not depositing after the donation: entering before a
/// donation is cheaper than entering after one by an unbounded margin, which is what a donation
/// means rather than a flaw. The claim is that holding part of a deposit back across a donation
/// never gains shares over committing it all at once.
///
/// NOT DISCHARGED: excluded from every config, see the
/// [timeout ledger](../../.github/workflows/fv-certora.yml).
rule holdingBackAcrossDonationDoesNotPay(env e, uint256 x, uint256 y, uint256 d, address receiver) {
    require sane();
    require nonpayable(e);
    require noVirtualOverflow();
    require receiver != 0 && e.msg.sender != currentContract;
    requireInvariant totalSupplyIsSumOfBalances();

    storage init = lastStorage;

    deposit(e, x, receiver);
    donate(e, d);
    deposit(e, y, receiver);
    mathint heldBack = balanceOf(receiver);

    deposit(e, assert_uint256(x + y), receiver) at init;
    donate(e, d);
    mathint upfront = balanceOf(receiver);

    assert heldBack <= upfront;
}

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P5: no method can lower the exchange rate                                                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// Deposits round shares minted down and withdrawals round shares burned up, so in every direction
/// the rounding residue stays with the vault and the price per share can only rise or hold.
///
/// Ranges over the harness method set, which includes donate(); see ERC4626Base.spec for why.
rule rateNeverDecreases(env e, method f) filtered { f -> !f.isView } {
    require sane();
    require noVirtualOverflow();
    require e.msg.sender != currentContract;
    requireInvariant totalSupplyIsSumOfBalances();

    mathint before = convertToAssets(ONE_SHARE());

    calldataarg args;
    f(e, args);

    assert to_mathint(convertToAssets(ONE_SHARE())) >= before;
}

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P6: an asset inflow never reduces what an existing holder can redeem                               │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// An inflow raises totalAssets and leaves totalSupply alone, so the conversion's denominator is
/// untouched and its numerator only grows.
///
/// Stated on the ghost rather than on donate() so it covers an inflow arriving by any means: a raw
/// transfer from an address that never touches the vault, yield accrual, a rebase up. donate()
/// itself is covered by rateNeverDecreases.
rule assetInflowNeverHarmsHolders(uint256 d, address holder) {
    require sane();
    require noVirtualOverflow();
    require holder != currentContract;
    requireInvariant totalSupplyIsSumOfBalances();

    address token = asset();
    // The post-state must convert too, or the second probe reverts and prunes the path invisibly.
    require to_mathint(totalAssets()) + to_mathint(d) < max_uint256;

    mathint before = previewRedeem(balanceOf(holder));

    balanceByToken[token][currentContract] =
        require_uint256(balanceByToken[token][currentContract] + d);

    assert to_mathint(previewRedeem(balanceOf(holder))) >= before;
}

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Conservation and isolation: the state-changers move exactly what they claim, and nothing else      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// Supporting machinery rather than a headline property. The value properties all assume the
/// operations move the right amounts between the right parties; without these they can pass for the
/// wrong reason.
///
/// `other` is a free rule parameter, so the prover quantifies over it universally. That is what
/// makes the isolation assertions meaningful with no disequality assumption and with no way to go
/// vacuous - a fresh symbol pinned by a `require` would give neither.
///
/// Every preview is read before the operation. Read afterwards it would be a different number,
/// since the operation moves both sides of the conversion.
rule depositConserves(env e, uint256 assets, address receiver, address other) {
    require sane();
    require nonpayable(e);
    require noVirtualOverflow();
    requireInvariant totalSupplyIsSumOfBalances();

    address caller = e.msg.sender;
    address token  = asset();
    require caller != currentContract && receiver != 0;

    mathint expectedShares       = previewDeposit(assets);
    mathint supplyBefore         = totalSupply();
    mathint receiverSharesBefore = balanceOf(receiver);
    mathint vaultAssetsBefore    = balanceByToken[token][currentContract];
    mathint callerAssetsBefore   = balanceByToken[token][caller];
    mathint otherSharesBefore    = balanceOf(other);
    mathint otherAssetsBefore    = balanceByToken[token][other];

    uint256 shares = deposit(e, assets, receiver);

    // effects: shares credited match the preview, assets moved match the request
    assert to_mathint(shares) == expectedShares;
    assert to_mathint(totalSupply())       == supplyBefore + shares;
    assert to_mathint(balanceOf(receiver)) == receiverSharesBefore + shares;
    assert balanceByToken[token][currentContract] == vaultAssetsBefore + assets;
    assert balanceByToken[token][caller]          == callerAssetsBefore - assets;

    // isolation: nobody else moved
    assert balanceOf(other) != otherSharesBefore => other == receiver;
    assert balanceByToken[token][other] != otherAssetsBefore
        => (other == caller || other == currentContract);
}

rule mintConserves(env e, uint256 shares, address receiver, address other) {
    require sane();
    require nonpayable(e);
    require noVirtualOverflow();
    requireInvariant totalSupplyIsSumOfBalances();

    address caller = e.msg.sender;
    address token  = asset();
    require caller != currentContract && receiver != 0;

    mathint expectedAssets       = previewMint(shares);
    mathint supplyBefore         = totalSupply();
    mathint receiverSharesBefore = balanceOf(receiver);
    mathint vaultAssetsBefore    = balanceByToken[token][currentContract];
    mathint callerAssetsBefore   = balanceByToken[token][caller];
    mathint otherSharesBefore    = balanceOf(other);
    mathint otherAssetsBefore    = balanceByToken[token][other];

    uint256 assets = mint(e, shares, receiver);

    assert to_mathint(assets) == expectedAssets;
    assert to_mathint(totalSupply())       == supplyBefore + shares;
    assert to_mathint(balanceOf(receiver)) == receiverSharesBefore + shares;
    assert balanceByToken[token][currentContract] == vaultAssetsBefore + assets;
    assert balanceByToken[token][caller]          == callerAssetsBefore - assets;

    assert balanceOf(other) != otherSharesBefore => other == receiver;
    assert balanceByToken[token][other] != otherAssetsBefore
        => (other == caller || other == currentContract);
}

/// Covers the third-party allowance path that the P3 liveness rules deliberately scoped out.
rule withdrawConserves(env e, uint256 assets, address receiver, address owner, address other) {
    require sane();
    require nonpayable(e);
    require noVirtualOverflow();
    requireInvariant totalSupplyIsSumOfBalances();

    address caller = e.msg.sender;
    address token  = asset();
    require caller != currentContract && receiver != 0 && receiver != currentContract;

    mathint expectedShares    = previewWithdraw(assets);
    mathint supplyBefore      = totalSupply();
    mathint ownerSharesBefore = balanceOf(owner);
    mathint vaultAssetsBefore = balanceByToken[token][currentContract];
    mathint recvAssetsBefore  = balanceByToken[token][receiver];
    mathint allowanceBefore   = allowance(owner, caller);
    mathint otherSharesBefore = balanceOf(other);
    mathint otherAssetsBefore = balanceByToken[token][other];

    uint256 shares = withdraw(e, assets, receiver, owner);

    assert to_mathint(shares) == expectedShares;
    assert to_mathint(totalSupply())    == supplyBefore - shares;
    assert to_mathint(balanceOf(owner)) == ownerSharesBefore - shares;
    assert balanceByToken[token][currentContract] == vaultAssetsBefore - assets;
    assert balanceByToken[token][receiver]        == recvAssetsBefore + assets;

    // A third-party caller spends allowance; the owner acting for themselves does not. Infinite
    // approval is left untouched, by ERC20 design.
    assert caller != owner && allowanceBefore < to_mathint(max_uint256)
        => to_mathint(allowance(owner, caller)) == allowanceBefore - shares;
    assert caller != owner && allowanceBefore == to_mathint(max_uint256)
        => to_mathint(allowance(owner, caller)) == allowanceBefore;
    assert caller == owner => to_mathint(allowance(owner, caller)) == allowanceBefore;

    assert balanceOf(other) != otherSharesBefore => other == owner;
    assert balanceByToken[token][other] != otherAssetsBefore
        => (other == receiver || other == currentContract);
}

rule redeemConserves(env e, uint256 shares, address receiver, address owner, address other) {
    require sane();
    require nonpayable(e);
    require noVirtualOverflow();
    requireInvariant totalSupplyIsSumOfBalances();

    address caller = e.msg.sender;
    address token  = asset();
    require caller != currentContract && receiver != 0 && receiver != currentContract;

    mathint expectedAssets    = previewRedeem(shares);
    mathint supplyBefore      = totalSupply();
    mathint ownerSharesBefore = balanceOf(owner);
    mathint vaultAssetsBefore = balanceByToken[token][currentContract];
    mathint recvAssetsBefore  = balanceByToken[token][receiver];
    mathint allowanceBefore   = allowance(owner, caller);
    mathint otherSharesBefore = balanceOf(other);
    mathint otherAssetsBefore = balanceByToken[token][other];

    uint256 assets = redeem(e, shares, receiver, owner);

    assert to_mathint(assets) == expectedAssets;
    assert to_mathint(totalSupply())    == supplyBefore - shares;
    assert to_mathint(balanceOf(owner)) == ownerSharesBefore - shares;
    assert balanceByToken[token][currentContract] == vaultAssetsBefore - assets;
    assert balanceByToken[token][receiver]        == recvAssetsBefore + assets;

    assert caller != owner && allowanceBefore < to_mathint(max_uint256)
        => to_mathint(allowance(owner, caller)) == allowanceBefore - shares;
    assert caller != owner && allowanceBefore == to_mathint(max_uint256)
        => to_mathint(allowance(owner, caller)) == allowanceBefore;
    assert caller == owner => to_mathint(allowance(owner, caller)) == allowanceBefore;

    assert balanceOf(other) != otherSharesBefore => other == owner;
    assert balanceByToken[token][other] != otherAssetsBefore
        => (other == receiver || other == currentContract);
}
