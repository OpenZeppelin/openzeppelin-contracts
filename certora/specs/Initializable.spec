methods {
    // initialize, reinitialize, disable
    initialize()
    reinitialize(uint8)
    disable()

    // view
    version()      returns uint8 envfree
    initializing() returns bool  envfree
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Definitions                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition isUninitialized() returns bool = version() == 0;
definition isInitialized()   returns bool = version() > 0;
definition isDisabled()      returns bool = version() == 255;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: A contract must only ever be in an initializing state while in the middle of a transaction execution.    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant notInitializing()
    !initializing()

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: The version cannot decrease & disable state is irrevocable.                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule increasingVersion(env e) {
    uint8 versionBefore = version();
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
rule cannotInitializeTwice(env e) {
    require isInitialized();

    initialize@withrevert(e);

    assert lastReverted, "contract must only be initialized once";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Cannot initialize once disabled.                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cannotInitializeOnceDisabled(env e) {
    require isDisabled();

    initialize@withrevert(e);

    assert lastReverted, "contract is disabled";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Cannot reinitialize once disabled.                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule cannotReinitializeOnceDisabled(env e) {
    require isDisabled();

    uint8 n;
    reinitialize@withrevert(e, n);

    assert lastReverted, "contract is disabled";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Initialize correcly sets the version.                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule initializeEffects(env e) {
    requireInvariant notInitializing();

    bool isUninitializedBefore = isUninitialized();

    initialize@withrevert(e);
    bool success = !lastReverted;

    assert success <=> isUninitializedBefore, "can only initialize uninitialized contracts";
    assert success => version() == 1,         "initialize must set version() to 1";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Reinitialize correcly sets the version.                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule reinitializeEffects(env e) {
    requireInvariant notInitializing();

    uint8 versionBefore = version();

    uint8 n;
    reinitialize@withrevert(e, n);
    bool success = !lastReverted;

    assert success <=> versionBefore < n, "can only reinitialize to a latter versions";
    assert success => version() == n,     "reinitialize must set version() to n";
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Can disable.                                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule disableEffect(env e) {
    requireInvariant notInitializing();

    disable@withrevert(e);
    bool success = !lastReverted;

    assert success,      "call to _disableInitializers failed";
    assert isDisabled(), "disable state not set";
}
