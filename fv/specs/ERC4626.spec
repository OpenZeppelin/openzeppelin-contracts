import "ERC4626Base.spec";
import "helpers/erc20-supply.spec";

// Checks that every contract function has at least one non-reverting path. A function that always
// reverts makes every rule calling it vacuous, with no `require` involved.
use builtin rule sanity;

// Proves the imported sum-of-balances invariant here, rather than only assuming it.
use invariant totalSupplyIsSumOfBalances;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Vacuity guard: if the scope assumptions are unsatisfiable, every rule below passes for free         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule setupIsSatisfiable(env e, uint256 assets, address receiver) {
    require sane();
    require nonpayable(e);
    deposit(e, assets, receiver);
    satisfy true;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P1: the vault is never over-committed - every outstanding share is redeemable simultaneously        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// Holds in every state, with no assumption about how that state was reached, so this is stated as a
/// rule rather than an invariant: it needs no induction, and quantifying over all sane states is
/// stronger than quantifying over reachable ones.
///
/// Independent of the decimals offset: with K = 10^offset >= 1,
/// previewRedeem(T) = floor(T(A+1)/(T+K)), and floor(x) <= A iff x < A+1, so the obligation reduces
/// to T(A+1) < (A+1)(T+K), i.e. 0 < (A+1)K. True for all T, A and K >= 1 - note this needs no
/// relationship between T and A, which is exactly why induction is unnecessary.
rule vaultNeverOvercommitted() {
    require sane();
    assert previewRedeem(totalSupply()) <= totalAssets();
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P2: round trips never create value, and per-operation leakage is at most one unit                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
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

/// The tightness half. Bounding leakage at one unit is worth far more than a vague `>=`, and it
/// catches a preview override whose rounding direction is transposed, which ERC4626 warns about:
/// overrides to the deposit or withdraw mechanism must be reflected in the preview functions.
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
