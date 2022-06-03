methods {
    initialize(uint256, uint256, uint256) envfree
    reinitialize(uint256, uint256, uint256, uint8) envfree
    initialized() returns uint8 envfree
    initializing() returns bool envfree
    thisIsContract() returns bool envfree

    returnsV1() returns uint256 envfree
    returnsVN(uint8) returns uint256 envfree
    returnsAV1() returns uint256 envfree
    returnsAVN(uint8) returns uint256 envfree
    returnsBV1() returns uint256 envfree
    returnsBVN(uint8) returns uint256 envfree
    a() returns uint256 envfree
    b() returns uint256 envfree
    val() returns uint256 envfree
}


//////////////////////////////////////////////////////////////////////////////
//////////////////////////////// Definitions /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

definition isUninitialized() returns bool = initialized() == 0;

definition isInitialized() returns bool = initialized() > 0;

definition isInitializedOnce() returns bool = initialized() == 1;

definition isReinitialized() returns bool = initialized() > 1;

definition isDisabled() returns bool = initialized() == 255;


//////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Invariants /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/// @description A contract must only ever be in an initializing state while in the middle of a transaction execution.
invariant notInitializing()
    !initializing(), "contract must not be initializing"


//////////////////////////////////////////////////////////////////////////////
////////////////////////////////// Rules /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/// @description An initializeable contract with a function that inherits the initializer modifier must be initializable only once"
rule initOnce() {
    uint256 val; uint256 a; uint256 b;

    require isInitialized();
    initialize@withrevert(val, a, b);
    assert lastReverted, "contract must only be initialized once";
}

/// @description Successfully calling reinitialize() with a version value of 1 must result in _initialized being set to 1.
rule reinitializeEffects {
    uint256 val; uint256 a; uint256 b;

    reinitialize(val, a, b, 1);

    assert isInitializedOnce(), "reinitialize(1) must set _initialized to 1";
}

/// @description Successfully calling initalize() must result in _initialized being set to 1.
/// @note We assume initialize() and reinitialize(1) are equivalent if this rule and the above rule, reinitalizeEffects, both pass.
rule initalizeEffects {
    uint256 val; uint256 a; uint256 b;

    initialize(val, a, b);

    assert isInitializedOnce(), "initialize() must set _initialized to 1";
}

/// @description A disabled initializable contract must always stay disabled.
rule disabledStaysDisabled(method f) {
    env e; calldataarg args; 

    bool disabledBefore = isDisabled();
    f(e, args);
    bool disabledAfter = isDisabled();

    assert disabledBefore => disabledAfter, "a disabled initializer must stay disabled";
}

/// @description The variable _initialized must not decrease.
rule increasingInitialized(method f) {
    env e; calldataarg args;

    uint8 initBefore = initialized();
    f(e, args);
    uint8 initAfter = initialized();
    assert initBefore <= initAfter, "_initialized must only increase";
}

/// @description If reinitialize(...) was called successfuly, then the variable _initialized must increases.
rule reinitializeIncreasesInit {
    uint256 val; uint8 n; uint256 a; uint256 b;

    uint8 initBefore = initialized();
    reinitialize(val, a, b, n);
    uint8 initAfter = initialized();

    assert initAfter > initBefore, "calling reinitialize must increase _initialized";
}

/// @description Reinitialize(n) must be callable if the contract is not in an _initializing state and n is greater than _initialized and less than 255
rule reinitializeLiveness {
    uint256 val; uint8 n; uint256 a; uint256 b;

    requireInvariant notInitializing();
    uint8 initVal = initialized();
    reinitialize@withrevert(val, a, b, n);

    assert n > initVal => !lastReverted, "reinitialize(n) call must succeed if n was greater than _initialized";
}

/// @description If reinitialize(n) was called successfully then n was greater than _initialized.
rule reinitializeRule {
    uint256 val; uint8 n; uint256 a; uint256 b;

    uint8 initBefore = initialized();
    reinitialize(val, a, b, n);

    assert n > initBefore;
}

/// @description Functions implemented in the parent contract that require _initialized to be a certain value are only callable when it is that value. 
rule reinitVersionCheckParent {
    uint8 n;

    returnsVN(n);
    assert initialized() == n, "parent contract's version n functions must only be callable in version n";
}

/// @description Functions implemented in the child contract that require _initialized to be a certain value are only callable when it is that value.
rule reinitVersionCheckChild {
    uint8 n;

    returnsAVN(n);
    assert initialized() == n, "child contract's version n functions must only be callable in version n";
}

/// @description Functions implemented in the grandchild contract that require _initialized to be a certain value are only callable when it is that value.
rule reinitVersionCheckGrandchild {
    uint8 n;

    returnsBVN(n);
    assert initialized() == n, "gransdchild contract's version n functions must only be callable in version n";
}

// @description Calling parent initalizer function must initialize all child contracts.
rule inheritanceCheck {
    uint256 val; uint8 n; uint256 a; uint256 b;

    reinitialize(val, a, b, n);
    assert val() == val && a() == a && b() == b, "all child contract values must be initialized";
}
