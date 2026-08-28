// Kept out of ERC4626.spec so that its tuned config does not drag the whole tier-1 sweep along with
// it. The scope this rule is proved under is narrower than the property's usual statement; see the
// rule's own note.
//
// Two configs verify this file against two harnesses: ERC4626Sandwich.conf at a zero decimals
// offset, ERC4626OffsetSandwich.conf at a symbolic one. Nothing here mentions the offset, so the
// same rule text carries over unchanged.

import "ERC4626Base.spec";
import "helpers/erc20-supply.spec";

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P7: the donation sandwich is not profitable against a fresh vault                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// The inflation/donation-frontrunning attack: enter, inflate the share price with a donation, let a
/// victim deposit at the manipulated rate, exit. Asserting the attacker's ASSET balance never rises
/// across the whole sequence captures "never profits" in one assertion, with no separate accounting
/// of what they paid.
///
/// Scoped to a vault that starts empty, which is both what the virtual-shares mitigation claims and
/// the only scope in which the claim is true. Starting from an arbitrary (totalSupply, totalAssets)
/// admits states that are already manipulated - one share outstanding against a large asset balance,
/// say - where an attacker profits without donating anything, because the price was inflated before
/// the sequence began. Attributing that to this contract's rounding would be wrong: the contract
/// documents that empty and nearly-empty vaults are the hazard and directs deployers to seed them.
///
/// Because totalSupply starts at zero, the attacker necessarily starts with no shares, so redeeming
/// their whole balance redeems only what this sequence minted.
rule donationSandwichNeverProfits(env eAtt, env eVic, uint256 a1, uint256 d, uint256 a2) {
    require sane();
    require nonpayable(eAtt) && nonpayable(eVic);
    require noVirtualOverflow();
    requireInvariant totalSupplyIsSumOfBalances();

    address attacker = eAtt.msg.sender;
    address victim   = eVic.msg.sender;
    address token    = asset();
    require attacker != victim;
    require attacker != currentContract && victim != currentContract;
    require attacker != 0 && victim != 0;

    // A fresh vault: no shares outstanding and no assets held.
    require totalSupply() == 0 && totalAssets() == 0;

    mathint attackerAssetsBefore = balanceByToken[token][attacker];

    deposit(eAtt, a1, attacker);                            // attacker enters
    donate(eAtt, d);                                        // inflate the rate
    deposit(eVic, a2, victim);                              // victim deposits at the new rate
    redeem(eAtt, balanceOf(attacker), attacker, attacker);  // attacker exits fully

    assert balanceByToken[token][attacker] <= attackerAssetsBefore;
}

/// Vacuity guard for the rule above: the four-call sequence has to be constructible at all, or its
/// green means nothing.
rule sandwichScenarioIsReachable(env eAtt, env eVic, uint256 a1, uint256 d, uint256 a2) {
    require sane();
    require nonpayable(eAtt) && nonpayable(eVic);
    require eAtt.msg.sender != eVic.msg.sender;
    require eAtt.msg.sender != currentContract && eVic.msg.sender != currentContract;
    require totalSupply() == 0 && totalAssets() == 0;

    deposit(eAtt, a1, eAtt.msg.sender);
    donate(eAtt, d);
    deposit(eVic, a2, eVic.msg.sender);
    satisfy true;
}
