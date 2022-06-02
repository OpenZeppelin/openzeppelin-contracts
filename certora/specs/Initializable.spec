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

definition isUninitialized() returns bool = initialized() == 0;

definition isInitialized() returns bool = initialized() > 0;

definition isInitializedOnce() returns bool = initialized() == 1;

definition isReinitialized() returns bool = initialized() > 1;

definition isDisabled() returns bool = initialized() == 255;

/*
idea : need extensive harness to test upgrading with reinitialize 

Setup:

contracts A, B, C

Scenario where B extends A and both are being initialized

Potentially need to summarize ‘isContract’

Multiple Versioning within one contract

 

Test Cases: 

Simple

1 contract with initialize and reinitialize methods (v 1-3)

Multiple Inheritance 

Contracts A, B, C

C Inherits from B, which Inherits from A

Properties

/// You can only initialize once  
/// two rules prove initialize is equivalent to reinitialize(1) property (?) -- what other effects from these calls?
// if reinitialize(1) is called successfully, _initialized is set to 1
// if initialize is called successfully, _initialized is set to 1
/// disabled stays disabled
// invariant
// or rule?
/// n increase iff reinitialize succeeds 
// n only increases
// reinitialize called => n increases 
/// You can reinitialize(n) iff n > _initialized && initialized < 256 (maxuint8) 
// <=
// =>
/// can only cal v1 function in v1

Question: can we handle reentrancy?
*/

// You can only initialize once  
rule initOnce() {
    uint256 val; uint256 a; uint256 b;

    require isInitialized();
    initialize@withrevert(val, a, b);
    assert lastReverted;
}

/// two rules prove initialize is equivalent to reinitialize(1) property (?) -- what other effects from these calls?

// if reinitialize(1) is called successfully, _initialized is set to 1
rule basicReinitializeEffects() {
    uint256 val; uint256 a; uint256 b;

    reinitialize(val, a, b, 1);

    assert isInitializedOnce();
}

// if initialize is called successfully, _initialized is set to 1
rule initalizeEffects(method f) {
    env e; calldataarg args;

    f(e, args);

    assert f.selector == initialize(uint256, uint256, uint256).selector => isInitializedOnce();
}

/// disabled stays disabled

// invariant
invariant disabledStaysDisabledInv()
    isDisabled() => isDisabled()

// or rule?
rule disabledStaysDisabled(method f) {
    env e; calldataarg args; 

    bool disabledBefore = isDisabled();
    f(e, args);
    bool disabledAfter = isDisabled();

    assert disabledBefore => disabledAfter;
}

/// n increase iff reinitialize succeeds 

// n only increases
rule increasingInitialized(method f) {
    env e; calldataarg args;

    uint8 initBefore = initialized();
    f(e, args);
    uint8 initAfter = initialized();
    assert initBefore <= initAfter;
}

// reinitialize called => n increases 
rule reinitializeIncreasesInit() {
    uint256 val; uint8 n; uint256 a; uint256 b;

    uint8 initBefore = initialized();
    reinitialize(val, a, b, n);
    uint8 initAfter = initialized();

    assert initAfter > initBefore;
}

/// You can reinitialize(n) iff n > _initialized && initialized < 256 (maxuint8) 

// <=
rule reinitializeLiveness() {
    env e; uint256 val; uint8 n; uint256 a; uint256 b;

    require !initializing();
    uint8 initVal = initialized();
    reinitialize@withrevert(val, a, b, n);

    assert n > initVal && initVal < 255 => !lastReverted;
}

// =>
rule reinitializeRule() {
    env e; calldataarg args; uint256 val; uint8 n; uint256 a; uint256 b;

    uint8 initBefore = initialized();
    reinitialize(val, a, b, n);
    uint8 initAfter = initialized();

    assert initAfter > initBefore => n > initBefore;
}

// can only call v1 functions in v1
rule initVersionCheck() {
    env e; calldataarg args; uint256 val; uint256 a; uint256 b; uint8 n; 

    require n != 1;

    initialize(val, a, b);
    assert returnsV1() == val / 2;
    assert returnsAV1() == a / 2;
    assert returnsBV1() == b / 2;
    returnsVN@withrevert(n);
    assert lastReverted;
    returnsAVN@withrevert(n);
    assert lastReverted;
    returnsBVN@withrevert(n);
    assert lastReverted;
}

// can only call V_n functions in V_n
rule reinitVersionCheck() {
    env e; calldataarg args; uint256 val; uint256 a; uint256 b; uint8 n; uint8 m;

    require n != m;

    reinitialize(val, a, b, n);
    assert returnsVN(n) == val / (n + 1);
    assert returnsAVN(n) == a / (n + 1);
    assert returnsBVN(n) == b / (n + 1);

    returnsVN@withrevert(m);
    assert lastReverted;
    returnsAVN@withrevert(m);
    assert lastReverted;
    returnsBVN@withrevert(m);
    assert lastReverted;
}

rule inheritanceCheck() {
    env e; calldataarg args; uint256 val; uint8 n; uint256 a; uint256 b;

    initialize(val, a, b);
    assert val() == val && a() == a && b() == b;
}
