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
