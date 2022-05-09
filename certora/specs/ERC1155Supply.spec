
rule sanity {
    method f; env e; calldataarg args;

    f(e, args);

    assert false;
}

