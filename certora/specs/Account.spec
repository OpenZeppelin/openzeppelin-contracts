import "helpers/helpers.spec";
import "methods/IAccount.spec";

methods {
    function getDataSelector(bytes)        external returns (bytes4) envfree;
    function getFallbackHandler(bytes4)    external returns (address) envfree;

    function _validatorLength()            external returns (uint256) envfree;
    function _validatorContains(address)   external returns (bool)    envfree;
    function _validatorAt(uint256)         external returns (address) envfree;
    function _validatorPositionOf(address) external returns (uint256) envfree;

    function _executorLength()             external returns (uint256) envfree;
    function _executorContains(address)    external returns (bool)    envfree;
    function _executorAt(uint256)          external returns (address) envfree;
    function _executorPositionOf(address)  external returns (uint256) envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                Storage consistency - Copied from EnumerableSet.specs                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition moduleLengthSanity() returns bool =
    _validatorLength() < max_uint256 && _executorLength() < max_uint256;

invariant validatorAtUniquenessInvariant(uint256 index1, uint256 index2)
    index1 == index2 <=> _validatorAt(index1) == _validatorAt(index2)
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved uninstallModule(uint256 moduleTypeId, address module, bytes deInitData) with (env e) {
            requireInvariant validatorAtUniquenessInvariant(index1, require_uint256(_validatorLength() - 1));
            requireInvariant validatorAtUniquenessInvariant(index2, require_uint256(_validatorLength() - 1));
        }
    }

invariant validatorConsistencyKeyInvariant(address module)
    _validatorContains(module) <=> (
        _validatorPositionOf(module) > 0 &&
        _validatorPositionOf(module) <= _validatorLength() &&
        _validatorAt(require_uint256(_validatorPositionOf(module) - 1)) == module
    )
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved uninstallModule(uint256 moduleTypeId, address otherModule, bytes deInitData) with (env e) {
            requireInvariant validatorConsistencyKeyInvariant(otherModule);
            requireInvariant validatorAtUniquenessInvariant(
                require_uint256(_validatorPositionOf(module) - 1),
                require_uint256(_validatorPositionOf(otherModule) - 1)
            );
        }
    }

invariant executorAtUniquenessInvariant(uint256 index1, uint256 index2)
    index1 == index2 <=> _executorAt(index1) == _executorAt(index2)
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved uninstallModule(uint256 moduleTypeId, address module, bytes deInitData) with (env e) {
            requireInvariant executorAtUniquenessInvariant(index1, require_uint256(_executorLength() - 1));
            requireInvariant executorAtUniquenessInvariant(index2, require_uint256(_executorLength() - 1));
        }
    }

invariant executorConsistencyKeyInvariant(address module)
    _executorContains(module) <=> (
        _executorPositionOf(module) > 0 &&
        _executorPositionOf(module) <= _executorLength() &&
        _executorAt(require_uint256(_executorPositionOf(module) - 1)) == module
    )
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved uninstallModule(uint256 moduleTypeId, address otherModule, bytes deInitData) with (env e) {
            requireInvariant executorConsistencyKeyInvariant(otherModule);
            requireInvariant executorAtUniquenessInvariant(
                require_uint256(_executorPositionOf(module) - 1),
                require_uint256(_executorPositionOf(otherModule) - 1)
            );
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  Module management                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// This guarantees that at most one fallback module is active for a given initData (i.e. selector)
invariant fallbackModule(env e, address module, bytes initData)
    isModuleInstalled(3, module, initData) <=> getFallbackHandler(getDataSelector(initData)) == module;

rule moduleManagementRule(
    env e,
    method f,
    calldataarg args,
    uint256 moduleTypeId,
    address module,
    bytes additionalContext
) filtered { f -> !f.isView } {
    bytes context;
    require context.length == 0;

    bool isEntryPoint = e.msg.sender == entryPoint();
    bool isEntryPointOrSelf = e.msg.sender == entryPoint() || e.msg.sender == currentContract;
    bool isExecutionModule = isModuleInstalled(2, e.msg.sender, context);

    bool isModuleInstalledBefore = isModuleInstalled(moduleTypeId, module, additionalContext);
    f(e, args);
    bool isModuleInstalledAfter = isModuleInstalled(moduleTypeId, module, additionalContext);

    assert (
        isModuleInstalledBefore != isModuleInstalledAfter
    ) => (
        (
            f.selector == sig:execute(bytes32,bytes).selector  &&
            isEntryPointOrSelf
        ) || (
            f.selector == sig:executeFromExecutor(bytes32,bytes).selector &&
            isExecutionModule
        ) || (
            f.selector == sig:installModule(uint256,address,bytes).selector &&
            isEntryPointOrSelf
        ) || (
            f.selector == sig:uninstallModule(uint256,address,bytes).selector &&
            isEntryPointOrSelf
        )
    );
}

rule installModuleRule(env e, uint256 moduleTypeId, address module, bytes initData) {
    uint256 otherModuleTypeId;
    address otherModule;
    bytes otherInitData;

    require moduleLengthSanity();
    requireInvariant executorConsistencyKeyInvariant(module);
    requireInvariant validatorConsistencyKeyInvariant(module);
    requireInvariant executorConsistencyKeyInvariant(otherModule);
    requireInvariant validatorConsistencyKeyInvariant(otherModule);

    bool isModuleInstalledBefore = isModuleInstalled(moduleTypeId, module, initData);
    bool isOtherModuleInstalledBefore = isModuleInstalled(otherModuleTypeId, otherModule, otherInitData);

    installModule(e, moduleTypeId, module, initData);

    bool isModuleInstalledAfter = isModuleInstalled(moduleTypeId, module, initData);
    bool isOtherModuleInstalledAfter = isModuleInstalled(otherModuleTypeId, otherModule, otherInitData);

    // Module is installed correctly
    assert !isModuleInstalledBefore && isModuleInstalledAfter;

    // No side effect on other modules
    assert isOtherModuleInstalledBefore != isOtherModuleInstalledAfter => (
        (
            moduleTypeId == otherModuleTypeId &&
            module == otherModule
        ) || (
            // when a fallback module is installed, the 0 module is "removed" for that selector
            otherModuleTypeId == 3 && // fallback
            otherModule == 0 &&
            getDataSelector(otherInitData) == getDataSelector(initData) &&
            isOtherModuleInstalledBefore &&
            !isOtherModuleInstalledAfter
        )
    );
}

rule uninstallModuleRule(env e, uint256 moduleTypeId, address module, bytes initData) {
    uint256 otherModuleTypeId;
    address otherModule;
    bytes otherInitData;

    require moduleLengthSanity();
    requireInvariant executorConsistencyKeyInvariant(module);
    requireInvariant validatorConsistencyKeyInvariant(module);
    requireInvariant executorConsistencyKeyInvariant(otherModule);
    requireInvariant validatorConsistencyKeyInvariant(otherModule);

    bool isModuleInstalledBefore = isModuleInstalled(moduleTypeId, module, initData);
    bool isOtherModuleInstalledBefore = isModuleInstalled(otherModuleTypeId, otherModule, otherInitData);

    uninstallModule(e, moduleTypeId, module, initData);

    bool isModuleInstalledAfter = isModuleInstalled(moduleTypeId, module, initData);
    bool isOtherModuleInstalledAfter = isModuleInstalled(otherModuleTypeId, otherModule, otherInitData);

    // Module is installed correctly
    assert isModuleInstalledBefore && !isModuleInstalledAfter;

    // No side effect on other modules
    assert isOtherModuleInstalledBefore != isOtherModuleInstalledAfter => (
        (
            moduleTypeId == otherModuleTypeId &&
            module == otherModule
        ) || (
            // when a fallback module is uninstalled, the 0 module is "added" for that selector
            otherModuleTypeId == 3 && // fallback
            otherModule == 0 &&
            getDataSelector(otherInitData) == getDataSelector(initData) &&
            !isOtherModuleInstalledBefore &&
            isOtherModuleInstalledAfter
        )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                     CALL OPCODE                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
persistent ghost bool    call;
persistent ghost address call_target;
persistent ghost uint32  call_selector;
persistent ghost uint256 call_value;
persistent ghost uint256 call_argsLength;

hook CALL(uint256 gas, address target, uint256 value, uint256 argsOffset, uint256 argsLength, uint256 retOffset, uint256 retLength) uint256 rc {
    if (executingContract == currentContract) {
        call            = true;
        call_target     = target;
        call_selector   = selector;
        call_value      = value;
        call_argsLength = argsLength;
    }
}

rule callOpcodeRule(
    env e,
    method f,
    calldataarg args
) filtered { f -> !f.isView } {
    require !call;

    bytes context;
    require context.length == 0;

    bool isEntryPoint = e.msg.sender == entryPoint();
    bool isEntryPointOrSelf = e.msg.sender == entryPoint() || e.msg.sender == currentContract;
    bool isExecutionModule = isModuleInstalled(2, e.msg.sender, context);

    f(e, args);

    assert call => (
        (
            // Can call any target with any data and value
            f.selector == sig:execute(bytes32,bytes).selector &&
            isEntryPointOrSelf
        ) || (
            // Can call any target with any data and value
            f.selector == sig:executeFromExecutor(bytes32,bytes).selector &&
            isExecutionModule
        ) || (
            // Can only call a module without any value. Target is verified by `callInstallModule`.
            f.selector == sig:installModule(uint256,address,bytes).selector &&
            isEntryPointOrSelf &&
            call_selector == 0x6d61fe70 && // onInstall(bytes)
            call_value == 0
        ) || (
            // Can only call a module without any value. Target is verified by `callInstallModule`.
            f.selector == sig:uninstallModule(uint256,address,bytes).selector &&
            isEntryPointOrSelf &&
            call_selector == 0x8a91b0e3 && // onUninstall(bytes)
            call_value == 0
        ) || (
            // Can send payment to the entrypoint or perform an external signature verification.
            f.selector == sig:validateUserOp(Account.PackedUserOperation,bytes32,uint256).selector &&
            isEntryPoint &&
            (
                (
                    // payPrefund (target is entryPoint and argsLength is 0)
                    call_target == entryPoint() &&
                    call_value > 0 &&
                    call_argsLength == 0
                ) || (
                    // isValidSignatureWithSender (target is as validation module)
                    isModuleInstalled(1, call_target, context) &&
                    call_selector == 0x97003203 && // validateUserOp(Account.PackedUserOperation,bytes32)
                    call_value == 0
                )
            )
        ) || (
            // Arbitrary fallback, to the correct fallback handler
            f.isFallback &&
            call_target == getFallbackHandler(to_bytes4(call_selector)) &&
            call_value == e.msg.value
        )
    );
}

rule callInstallModule(env e, uint256 moduleTypeId, address module, bytes initData) {
    installModule(e, moduleTypeId, module, initData);

    assert call          == true;
    assert call_target   == module;
    assert call_selector == 0x6d61fe70; // onInstall(bytes)
    assert call_value    == 0;
}

rule callUninstallModule(env e, uint256 moduleTypeId, address module, bytes deInitData) {
    uninstallModule(e, moduleTypeId, module, deInitData);

    assert call          == true;
    assert call_target   == module;
    assert call_selector == 0x8a91b0e3; // onUninstall(bytes)
    assert call_value    == 0;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                 DELEGATECALL OPCODE                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
persistent ghost bool    delegatecall;
persistent ghost address delegatecall_target;
persistent ghost uint32  delegatecall_selector;
persistent ghost uint256 delegatecall_argsLength;

hook DELEGATECALL(uint256 gas, address target, uint256 argsOffset, uint256 argsLength, uint256 retOffset, uint256 retLength) uint256 rc {
    if (executingContract == currentContract) {
        delegatecall = true;
        delegatecall_target     = target;
        delegatecall_selector   = selector;
        delegatecall_argsLength = argsLength;
    }
}

rule delegatecallOpcodeRule(
    env e,
    method f,
    calldataarg args
) filtered { f -> !f.isView } {
    require !delegatecall;

    bytes context;
    require context.length == 0;

    bool isEntryPoint = e.msg.sender == entryPoint();
    bool isEntryPointOrSelf = e.msg.sender == entryPoint() || e.msg.sender == currentContract;
    bool isExecutionModule = isModuleInstalled(2, e.msg.sender, context);

    f(e, args);

    assert delegatecall => (
        (
            // Can delegatecall to target with any data
            f.selector == sig:execute(bytes32,bytes).selector &&
            isEntryPointOrSelf
        ) || (
            // Can delegatecall to target with any data
            f.selector == sig:executeFromExecutor(bytes32,bytes).selector &&
            isExecutionModule
        )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                      ERC-4337                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule validateUserOpPayment(env e){
    Account.PackedUserOperation userOp;
    bytes32 userOpHash;
    uint256 missingAccountFunds;

    uint256 balanceBefore = nativeBalances[currentContract];
    validateUserOp(e, userOp, userOpHash, missingAccountFunds);
    uint256 balanceAfter = nativeBalances[currentContract];

    assert balanceAfter >= balanceBefore - missingAccountFunds;
}
