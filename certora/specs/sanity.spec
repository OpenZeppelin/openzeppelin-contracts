/*
This rule looks for a non-reverting execution path to each method, including those overridden in the harness.
A method has such an execution path if it violates this rule.
How it works:
    - If there is a non-reverting execution path, we reach the false assertion, and the sanity fails.
    - If all execution paths are reverting, we never call the assertion, and the method will pass this rule vacuously.
*/
	
rule sanity(method f) {
    env e;
    calldataarg arg;
    f(e, arg);
    assert false;
}