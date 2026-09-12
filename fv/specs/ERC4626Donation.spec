// Kept out of ERC4626.spec so its tuned solver settings do not slow the tier-1 sweep.
//
// Verified by two configs: ERC4626Donation.conf against the zero-offset harness and
// ERC4626OffsetDonation.conf against the symbolic-offset one. Nothing here mentions the offset.

import "ERC4626Base.spec";
import "helpers/erc20-supply.spec";

/*
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ P7: the donation attack is not profitable against a fresh vault                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/// The inflation attack: enter, inflate the share price with a donation, let a victim deposit at the
/// manipulated rate, exit. Asserting the attacker's asset balance never rises across the sequence
/// captures "never profits" in one assertion, with no separate accounting of what they paid.
///
/// Scoped to a vault that starts empty: that is what the virtual-shares mitigation claims, and the
/// only scope in which the claim is true. An arbitrary (totalSupply, totalAssets) start admits states
/// that are already manipulated - one share outstanding against a large asset balance - where an
/// attacker profits without donating anything. ERC4626 documents that empty and nearly-empty vaults
/// are the hazard and directs deployers to seed them.
///
/// Because totalSupply starts at zero, the attacker starts with no shares, so redeeming their whole
/// balance redeems only what this sequence minted.
rule donationAttackNeverProfits(env eAtt, env eVic, uint256 a1, uint256 d, uint256 a2) {
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
