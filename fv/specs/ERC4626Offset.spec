// Tier 4: the same claims, with the decimals offset left symbolic.
//
// Every other spec in this suite runs against a harness whose _decimalsOffset() is 0, so K = 1 in
// both conversion denominators and nothing proved there generalizes. Here the offset is an
// immutable the prover leaves unconstrained, so K = 10**offset is symbolic. That turns a constant
// into an EXP over a symbolic exponent, a shape the rest of the suite never exercises. It turned
// out to be tractable unaided: nothing here abstracts 10**offset behind a ghost and no rule needs
// the offset bounded, so the tier carries no assumption the rest of the suite does not already.
//
// Offsets from 78 up make 10**offset overflow uint256, so every conversion reverts and the prover
// prunes those paths. The rules here are therefore claims about offsets 0 through 77.
//
// The donation sandwich is also re-proved at a symbolic offset, by ERC4626OffsetSandwich.conf
// pointing the unchanged ERC4626Sandwich.spec at this file's harness.

import "ERC4626Base.spec";

methods {
    function decimalsOffset() external returns (uint8) envfree;
    function virtualShares()  external returns (uint256) envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Vacuity guard: the offset is genuinely symbolic, and a live vault is reachable at a nonzero one     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// Without this, a rule below could pass because the scene admits no nonzero offset at all, which
/// would make the whole tier a restatement of what the zero-offset harness already proves.
rule offsetIsGenuinelySymbolic(uint256 shares) {
    require sane();
    require decimalsOffset() > 0;
    require totalSupply() > 0 && totalAssets() > 0;
    satisfy previewRedeem(shares) > 0;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P1 at a symbolic offset: the vault is never over-committed                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// The zero-offset proof of this reduces to 0 < (A+1)K, which holds for every K >= 1, so P1 should
/// carry to a symbolic offset unchanged, which is what makes it the right first check: it is the
/// cheapest rule in the suite, so a red here would mean the prover cannot handle a symbolic
/// exponent rather than that the property is harder.
rule vaultNeverOvercommittedAnyOffset() {
    require sane();
    assert previewRedeem(totalSupply()) <= totalAssets();
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ What the offset is FOR: it prices the inflation attack, and only a symbolic offset can say so       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// The suite's other rules establish that the vault is sound. None of them establishes that the
/// offset buys anything, because at offset 0 it is the identity - and soundness is not what the
/// offset is for. ERC4626 does not claim the virtual shares prevent the inflation attack; it claims
/// they make it "orders of magnitude more expensive than it is profitable". That is a claim about a
/// quantity, and it is invisible to any rule that pins the quantity to 1.
///
/// Stated exactly: a victim is only robbed if their deposit rounds to zero shares, and
/// previewDeposit(a) = floor(a(T+K)/(A+1)) is zero only when a(T+K) < A+1. With K = 10^offset and
/// T >= 0 that forces A >= a*K. So the victim loses a, and whoever set the vault up to do it had
/// already sunk at least a * 10^offset into it. The offset is the multiplier between the two.
///
/// The bound is tight rather than slack - A = a*K is reachable - so it is not passing for free.
/// At offset 0 it degrades to A >= a, which is true and worthless. Its strength IS the offset, and
/// it is violated by a mutation that drops the offset from the share conversion.
rule inflationCostScalesWithOffset(uint256 assets) {
    require sane();
    require assets > 0;
    require previewDeposit(assets) == 0;
    assert to_mathint(totalAssets()) >= to_mathint(assets) * to_mathint(virtualShares());
}

/// Guards the rule above against vacuity: if no state lets a nonzero deposit round to zero shares,
/// the bound holds over an empty set. It has to be reachable, because ERC4626 is explicit that the
/// mitigation does not fully prevent the attack.
rule victimCanBeRobbedAtAnyOffset(uint256 assets) {
    require sane();
    require assets > 0;
    satisfy previewDeposit(assets) == 0;
}
