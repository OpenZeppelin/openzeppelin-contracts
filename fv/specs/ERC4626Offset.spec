// Tier 4: the decimals offset left symbolic.
//
// Every other spec in this suite runs against a harness whose _decimalsOffset() is 0, so K = 1 in
// both conversion denominators and nothing proved there generalizes. Here the offset is an
// immutable the prover leaves unconstrained, so K = 10**offset is a symbolic exponentiation. No rule
// abstracts it behind a ghost or needs the offset bounded, so this tier carries no assumption the
// rest of the suite does not.
//
// Offsets from 78 up make 10**offset overflow uint256, so every conversion reverts and the prover
// prunes those paths. The rules here are claims about offsets 0 through 77.
//
// The donation attack is also re-proved at a symbolic offset: ERC4626OffsetDonation.conf points the
// unchanged ERC4626Donation.spec at this file's harness.

import "ERC4626Base.spec";

methods {
    function decimalsOffset() external returns (uint8) envfree;
    function virtualShares()  external returns (uint256) envfree;
}

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Vacuity guard: the offset is genuinely symbolic, and a live vault is reachable at a nonzero one    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// rule_sanity cannot catch this: every rule below is satisfiable at offset 0 alone, which would
/// make the tier a restatement of what the zero-offset harness already proves.
rule offsetIsGenuinelySymbolic(uint256 shares) {
    require sane();
    require decimalsOffset() > 0;
    require totalSupply() > 0 && totalAssets() > 0;
    satisfy previewRedeem(shares) > 0;
}

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P1: the vault is never over-committed - every outstanding share is redeemable simultaneously       │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// Holds in every state, with no assumption about how that state was reached, so this is stated as a
/// rule rather than an invariant: quantifying over all sane states is stronger than quantifying over
/// reachable ones.
///
/// With K = 10^offset >= 1, previewRedeem(T) = floor(T(A+1)/(T+K)), and floor(x) <= A iff x < A+1,
/// so the obligation reduces to T(A+1) < (A+1)(T+K), i.e. 0 < (A+1)K. True for all T, A and K >= 1
/// with no relationship between T and A, which is why induction is unnecessary. The bound is not
/// trivially tight: equality (T = A = 0) and strict inequality are both reachable.
///
/// Proved here rather than on the zero-offset harness because the argument is offset-independent
/// only on paper; this is the harness on which the prover checks it for every K.
rule vaultNeverOvercommitted() {
    require sane();
    assert previewRedeem(totalSupply()) <= totalAssets();
}

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ What the offset is FOR: it prices the inflation attack, and only a symbolic offset can say so      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// ERC4626 does not claim the virtual shares prevent the inflation attack; it claims they make it
/// "orders of magnitude more expensive than it is profitable". That is a claim about a quantity, and
/// it is invisible to any rule that pins the quantity to 1.
///
/// A victim is only robbed if their deposit rounds to zero shares, and
/// previewDeposit(a) = floor(a(T+K)/(A+1)) is zero only when a(T+K) < A+1. With K = 10^offset and
/// T >= 0 that forces A >= a*K: for a deposit of a to mint nothing, the vault must already hold at
/// least a * 10^offset assets, so the attack costs 10^offset times what it takes from the victim.
///
/// The bound is tight (A = a*K is reachable) and degrades to the trivially true A >= a at offset 0.
/// It is violated by a mutation that drops the offset from the share conversion.
rule inflationCostScalesWithOffset(uint256 assets) {
    require sane();
    require assets > 0;
    require previewDeposit(assets) == 0;
    assert to_mathint(totalAssets()) >= to_mathint(assets) * to_mathint(virtualShares());
}
