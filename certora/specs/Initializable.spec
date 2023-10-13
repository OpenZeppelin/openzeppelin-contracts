import "helpers/helpers.spec";

methods {
    // initialize, reinitialize, disable
    function initialize()         external envfree;
    function reinitialize(uint64) external envfree;
    function disable()            external envfree;

    function nested_init_init()                  external envfree;
    function nested_init_reinit(uint64)          external envfree;
    function nested_reinit_init(uint64)          external envfree;
    function nested_reinit_reinit(uint64,uint64) external envfree;

    // view
    function version()      external returns uint64 envfree;
    function initializing() external returns bool   envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Definitions                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition isUninitialized() returns bool = version() == 0;
definition isInitialized()   returns bool = version() > 0;
definition isDisabled()      returns bool = version() == max_uint64;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: A contract must only ever be in an initializing state while in the middle of a transaction execution.    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant notInitializing()
    !initializing();

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: The version cannot decrease & disable state is irrevocable.                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule increasingVersion(env e) {
    uint64 versionBefore = version();
    bool disabledBefore = isDisabled();

    method f; calldataarg args;
    f(e, args);

    assert versionBefore <= version(), "_initialized must only increase";
    assert disabledBefore => isDisabled(), "a disabled initializer must stay disabled";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Cannot initialize a contract that is already initialized.                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cannotInitializeTwice() {
    require isInitialized();

    initialize@withrevert();

    assert lastReverted, "contract must only be initialized once";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Cannot initialize once disabled.                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cannotInitializeOnceDisabled() {
    require isDisabled();

    initialize@withrevert();

    assert lastReverted, "contract is disabled";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Cannot reinitialize once disabled.                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cannotReinitializeOnceDisabled() {
    require isDisabled();

    uint64 n;
    reinitialize@withrevert(n);

    assert lastReverted, "contract is disabled";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Cannot nest initializers (after construction).                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cannotNestInitializers_init_init() {
    nested_init_init@withrevert();
    assert lastReverted, "nested initializers";
}

rule cannotNestInitializers_init_reinit(uint64 m) {
    nested_init_reinit@withrevert(m);
    assert lastReverted, "nested initializers";
}

rule cannotNestInitializers_reinit_init(uint64 n) {
    nested_reinit_init@withrevert(n);
    assert lastReverted, "nested initializers";
}

rule cannotNestInitializers_reinit_reinit(uint64 n, uint64 m) {
    nested_reinit_reinit@withrevert(n, m);
    assert lastReverted, "nested initializers";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Initialize correctly sets the version.                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule initializeEffects() {
    requireInvariant notInitializing();

    bool isUninitializedBefore = isUninitialized();

    initialize@withrevert();
    bool success = !lastReverted;

    assert success <=> isUninitializedBefore, "can only initialize uninitialized contracts";
    assert success => version() == 1,         "initialize must set version() to 1";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Reinitialize correctly sets the version.                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule reinitializeEffects() {
    requireInvariant notInitializing();

    uint64 versionBefore = version();

    uint64 n;
    reinitialize@withrevert(n);
    bool success = !lastReverted;

    assert success <=> versionBefore < n, "can only reinitialize to a latter versions";
    assert success => version() == n,     "reinitialize must set version() to n";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Can disable.                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule disableEffect() {
    requireInvariant notInitializing();

    disable@withrevert();
    bool success = !lastReverted;

    assert success,      "call to _disableInitializers failed";
    assert isDisabled(), "disable state not set";
}
