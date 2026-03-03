import "helpers/helpers.spec";

methods {
    function nonces(address) external returns (uint256) envfree;
    function useNonce(address) external returns (uint256) envfree;
    function useCheckedNonce(address,uint256) external envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function nonceSanity(address account) returns bool {
    return nonces(account) < max_uint256;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: useNonce uses nonce                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule useNonce(address account) {
    require nonceSanity(account);

    address other;

    mathint nonceBefore = nonces(account);
    mathint otherNonceBefore = nonces(other);

    mathint nonceUsed = useNonce@withrevert(account);
    bool success = !lastReverted;

    mathint nonceAfter = nonces(account);
    mathint otherNonceAfter = nonces(other);

    // liveness
    assert success, "doesn't revert";

    // effect
    assert nonceAfter == nonceBefore + 1 && nonceBefore == nonceUsed, "nonce is used";

    // no side effect
    assert otherNonceBefore != otherNonceAfter => other == account, "no other nonce is used";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Function correctness: useCheckedNonce uses only the current nonce                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule useCheckedNonce(address account, uint256 currentNonce) {
    require nonceSanity(account);

    address other;

    mathint nonceBefore = nonces(account);
    mathint otherNonceBefore = nonces(other);

    useCheckedNonce@withrevert(account, currentNonce);
    bool success = !lastReverted;

    mathint nonceAfter = nonces(account);
    mathint otherNonceAfter = nonces(other);

    // liveness
    assert success <=> to_mathint(currentNonce) == nonceBefore, "works iff current nonce is correct";

    // effect
    assert success => nonceAfter == nonceBefore + 1, "nonce is used";

    // no side effect
    assert otherNonceBefore != otherNonceAfter => other == account, "no other nonce is used";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: nonce only increments                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule nonceOnlyIncrements(address account) {
    require nonceSanity(account);

    mathint nonceBefore = nonces(account);

    env e; method f; calldataarg args;
    f(e, args);

    mathint nonceAfter = nonces(account);

    assert nonceAfter == nonceBefore || nonceAfter == nonceBefore + 1, "nonce only increments";
}
