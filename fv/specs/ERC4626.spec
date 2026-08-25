import "ERC4626Base.spec";

// Checks that every contract function has at least one non-reverting path. A function that always
// reverts makes every rule calling it vacuous, with no `require` involved.
use builtin rule sanity;

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
