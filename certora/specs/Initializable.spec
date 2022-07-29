//// ## Verification of Initializable
//// 
//// `Initializable` is a contract used to make constructors for upgradeable
//// contracts. This is accomplished by applying the `initializer` modifier to any
//// function that serves as a constructor, which makes this function only
//// callable once. The secondary modifier `reinitializer` allows for upgrades
//// that change the contract's initializations. 
////     
//// 
//// ### Assumptions and Simplifications
//// We assume `initializer()` and `reinitializer(1)` are equivalent if they
//// both guarentee `_initialized` to be set to 1 after a successful call. This
//// allows us to use `reinitializer(n)` as a general version that also handles
//// the regular `initialzer` case.
////     
//// #### Harnessing
//// Two harness versions were implemented, a simple flat contract, and a
//// Multi-inheriting contract. The two versions together help us ensure there are
//// No unexpected results because of different implementions. Initializable can
//// Be used in many different ways but we believe these 2 cases provide good
//// Coverage for all cases. In both harnesses we use getter functions for
//// `_initialized` and `_initializing` and implement  `initializer` and
//// `reinitializer` functions that use their respective modifiers. We also
//// Implement some versioned functions that are only callable in specific
//// Versions of the contract to mimick upgrading contracts.
////     
//// #### Munging
//// Variables `_initialized` and `_initializing` were changed to have internal
//// visibility to be harnessable.
    
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


////////////////////////////////////////////////////////////////////////////////
//// #### Definitions                                                       ////
////////////////////////////////////////////////////////////////////////////////

//// ***`isUninitialized:`*** A contract's `_initialized` variable is equal to 0.
definition isUninitialized() returns bool = initialized() == 0;

//// ***`isInitialized:`*** A contract's `_initialized` variable is greater than 0.
definition isInitialized() returns bool = initialized() > 0;

//// ***`isInitializedOnce:`*** A contract's `_initialized` variable is equal to 1.
definition isInitializedOnce() returns bool = initialized() == 1;

//// ***`isReinitialized:`*** A contract's `_initialized` variable is greater than 1.    
definition isReinitialized() returns bool = initialized() > 1;

//// ***`isDisabled:`*** A contract's `_initialized` variable is equal to 255.
definition isDisabled() returns bool = initialized() == 255;


//////////////////////////////////////////////////////////////////////////////
//// ### Properties                                ///////////////////////////
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
// Invariants                            /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/// A contract must only ever be in an initializing state while in the middle
/// of a transaction execution.
invariant notInitializing()
    !initializing()


//////////////////////////////////////////////////////////////////////////////
// Rules                                 /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/// @title Only initialized once
/// @notice An initializable contract with a function that inherits the
///         initializer modifier must be initializable only once
rule initOnce() {
    uint256 val; uint256 a; uint256 b;

    require isInitialized();
    initialize@withrevert(val, a, b);
    assert lastReverted, "contract must only be initialized once";
}

/// Successfully calling reinitialize() with a version value of 1 must result
/// in `_initialized` being set to 1.
rule reinitializeEffects {
    uint256 val; uint256 a; uint256 b;

    reinitialize(val, a, b, 1);

    assert isInitializedOnce(), "reinitialize(1) must set _initialized to 1";
}

/// Successfully calling `initalize()` must result in `_initialized` being set to 1.
/// @dev We assume `initialize()` and `reinitialize(1)` are equivalent if this rule
///      and the [above rule][#reinitalizeEffects] both pass.
rule initalizeEffects {
    uint256 val; uint256 a; uint256 b;

    initialize(val, a, b);

    assert isInitializedOnce(), "initialize() must set _initialized to 1";
}

/// A disabled initializable contract must always stay disabled.
rule disabledStaysDisabled(method f) {
    env e; calldataarg args; 

    bool disabledBefore = isDisabled();
    f(e, args);
    bool disabledAfter = isDisabled();

    assert disabledBefore => disabledAfter, "a disabled initializer must stay disabled";
}

/// The variable `_initialized` must not decrease.
rule increasingInitialized(method f) {
    env e; calldataarg args;

    uint8 initBefore = initialized();
    f(e, args);
    uint8 initAfter = initialized();
    assert initBefore <= initAfter, "_initialized must only increase";
}

/// If `reinitialize(...)` was called successfuly, then the variable
/// `_initialized` must increase.
rule reinitializeIncreasesInit {
    uint256 val; uint8 n; uint256 a; uint256 b;

    uint8 initBefore = initialized();
    reinitialize(val, a, b, n);
    uint8 initAfter = initialized();

    assert initAfter > initBefore, "calling reinitialize must increase _initialized";
}

/// `reinitialize(n)` must be callable if the contract is not in an
/// `_initializing` state and `n` is greater than `_initialized` and less than
/// 255
rule reinitializeLiveness {
    uint256 val; uint8 n; uint256 a; uint256 b;

    requireInvariant notInitializing();
    uint8 initVal = initialized();
    reinitialize@withrevert(val, a, b, n);

    assert n > initVal => !lastReverted, "reinitialize(n) call must succeed if n was greater than _initialized";
}

/// If `reinitialize(n)` was called successfully then `n` was greater than
/// `_initialized`.
rule reinitializeRule {
    uint256 val; uint8 n; uint256 a; uint256 b;

    uint8 initBefore = initialized();
    reinitialize(val, a, b, n);

    assert n > initBefore;
}

/// Functions implemented in the parent contract that require `_initialized` to
/// be a certain value are only callable when it is that value. 
rule reinitVersionCheckParent {
    uint8 n;

    returnsVN(n);
    assert initialized() == n, "parent contract's version n functions must only be callable in version n";
}

/// Functions implemented in the child contract that require `_initialized` to
/// be a certain value are only callable when it is that value.
rule reinitVersionCheckChild {
    uint8 n;

    returnsAVN(n);
    assert initialized() == n, "child contract's version n functions must only be callable in version n";
}

/// Functions implemented in the grandchild contract that require `_initialized`
/// to be a certain value are only callable when it is that value.
rule reinitVersionCheckGrandchild {
    uint8 n;

    returnsBVN(n);
    assert initialized() == n, "gransdchild contract's version n functions must only be callable in version n";
}

/// Calling parent initalizer function must initialize all child contracts.
rule inheritanceCheck {
    uint256 val; uint8 n; uint256 a; uint256 b;

    reinitialize(val, a, b, n);
    assert val() == val && a() == a && b() == b, "all child contract values must be initialized";
}

