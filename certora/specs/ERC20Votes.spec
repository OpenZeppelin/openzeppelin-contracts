rule sanity(method f) {
    env e;
    calldataarg arg;
    f(e, arg);
    assert false;
}