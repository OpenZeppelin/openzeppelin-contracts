// Sum-of-balances ghost for the shares token, extracted so several ERC4626 specs can share it.
//
// ERC20.spec keeps its own copy and is deliberately not imported here: its methods block requires
// mint and burn on the verification target, and exposing unbacked share mint on an ERC4626 harness
// would falsify the solvency and rate-monotonicity properties.

ghost mathint sumOfBalances {
    init_state axiom sumOfBalances == 0;
}

// Bounds a balance by the tracked sum. Without it, explicit casting admits a pre-state where one
// balance exceeds totalSupply and overflows on receipt - reachable only by deploying into a dirty
// address.
hook Sload uint256 balance _balances[KEY address addr] {
    require sumOfBalances >= to_mathint(balance);
}

hook Sstore _balances[KEY address addr] uint256 newValue (uint256 oldValue) {
    sumOfBalances = sumOfBalances - oldValue + newValue;
}

invariant totalSupplyIsSumOfBalances()
    to_mathint(totalSupply()) == sumOfBalances;
