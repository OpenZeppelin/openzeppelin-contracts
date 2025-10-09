import "helpers/helpers.spec";
import "methods/IAccount.spec";

methods {
    function getDataSelector(bytes)        external returns (bytes4)  envfree;
    function getFallbackHandler(bytes4)    external returns (address) envfree;

    function _validatorLength()            external returns (uint256) envfree;
    function _validatorContains(address)   external returns (bool)    envfree;
    function _validatorAt(uint256)         external returns (address) envfree;
    function _validatorAtFull(uint256)     external returns (bytes32) envfree;
    function _validatorPositionOf(address) external returns (uint256) envfree;

    function _executorLength()             external returns (uint256) envfree;
    function _executorContains(address)    external returns (bool)    envfree;
    function _executorAt(uint256)          external returns (address) envfree;
    function _executorAtFull(uint256)      external returns (bytes32) envfree;
    function _executorPositionOf(address)  external returns (uint256) envfree;

    function _.onInstall(bytes)            external => NONDET;
    function _.onUninstall(bytes)          external => NONDET;
}

definition VALIDATOR_TYPE returns uint256 = 1;
definition EXECUTOR_TYPE returns uint256 = 2;
definition FALLBACK_TYPE returns uint256 = 3;

definition isEntryPoint(env e) returns bool =
    e.msg.sender == entryPoint();

definition isEntryPointOrSelf(env e) returns bool =
    isEntryPoint(e) || e.msg.sender == currentContract;

definition isExecutionModule(env e, bytes context) returns bool =
    isModuleInstalled(EXECUTOR_TYPE(), e.msg.sender, context);

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                 Storage consistency                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition moduleLengthSanity() returns bool =
    _validatorLength() < max_uint256 && _executorLength() < max_uint256;

// Dirty upper bits could cause issues. We need to prove stored values are clean
invariant cleanStorageValidator(uint256 index)
    index < _validatorLength() => to_bytes32(_validatorAt(index)) == _validatorAtFull(index)
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved {
            requireInvariant cleanStorageValidator(require_uint256(_validatorLength() - 1));
        }
    }

// Dirty upper bits could cause issues. We need to prove stored values are clean
invariant cleanStorageExecutor(uint256 index)
    index < _executorLength() => to_bytes32(_executorAt(index)) == _executorAtFull(index)
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved {
            requireInvariant cleanStorageExecutor(require_uint256(_executorLength() - 1));
        }
    }

invariant indexedContainedValidator(uint256 index)
    index < _validatorLength() => _validatorContains(_validatorAt(index))
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved {
            requireInvariant consistencyIndexValidator(index);
            requireInvariant consistencyIndexValidator(require_uint256(_validatorLength() - 1));
        }
    }

invariant indexedContainedExecutor(uint256 index)
    index < _executorLength() => _executorContains(_executorAt(index))
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved {
            requireInvariant consistencyIndexExecutor(index);
            requireInvariant consistencyIndexExecutor(require_uint256(_executorLength() - 1));
        }
    }

invariant atUniquenessValidator(uint256 index1, uint256 index2)
    (index1 < _validatorLength() && index2 < _validatorLength()) =>
    (index1 == index2 <=> _validatorAt(index1) == _validatorAt(index2))
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved {
            requireInvariant consistencyIndexValidator(index1);
            requireInvariant consistencyIndexValidator(index2);
        }
        preserved uninstallModule(uint256 moduleTypeId, address module, bytes deInitData) with (env e) {
            requireInvariant atUniquenessValidator(index1, require_uint256(_validatorLength() - 1));
            requireInvariant atUniquenessValidator(index2, require_uint256(_validatorLength() - 1));
        }
    }

invariant atUniquenessExecutor(uint256 index1, uint256 index2)
    (index1 < _executorLength() && index2 < _executorLength()) =>
    (index1 == index2 <=> _executorAt(index1) == _executorAt(index2))
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved {
            requireInvariant consistencyIndexExecutor(index1);
            requireInvariant consistencyIndexExecutor(index2);
        }
        preserved uninstallModule(uint256 moduleTypeId, address module, bytes deInitData) with (env e) {
            requireInvariant atUniquenessExecutor(index1, require_uint256(_executorLength() - 1));
            requireInvariant atUniquenessExecutor(index2, require_uint256(_executorLength() - 1));
        }
    }

invariant consistencyIndexValidator(uint256 index)
    index < _validatorLength() => _validatorPositionOf(_validatorAt(index)) == require_uint256(index + 1)
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved uninstallModule(uint256 moduleTypeId, address otherModule, bytes deInitData) with (env e) {
            requireInvariant consistencyIndexValidator(require_uint256(_validatorLength() - 1));
            requireInvariant cleanStorageValidator(require_uint256(_validatorLength() - 1));
        }
    }

invariant consistencyIndexExecutor(uint256 index)
    index < _executorLength() => _executorPositionOf(_executorAt(index)) == require_uint256(index + 1)
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved uninstallModule(uint256 moduleTypeId, address otherModule, bytes deInitData) with (env e) {
            requireInvariant consistencyIndexExecutor(require_uint256(_executorLength() - 1));
            requireInvariant cleanStorageExecutor(require_uint256(_executorLength() - 1));
        }
    }

invariant consistencyKeyValidator(address module)
    _validatorContains(module) => (
        _validatorPositionOf(module) > 0 &&
        _validatorPositionOf(module) <= _validatorLength() &&
        _validatorAt(require_uint256(_validatorPositionOf(module) - 1)) == module
    )
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved {
            require moduleLengthSanity();
        }
        preserved uninstallModule(uint256 moduleTypeId, address otherModule, bytes deInitData) with (env e) {
            requireInvariant consistencyKeyValidator(otherModule);
            requireInvariant atUniquenessValidator(
                require_uint256(_validatorPositionOf(module) - 1),
                require_uint256(_validatorPositionOf(otherModule) - 1)
            );
            requireInvariant cleanStorageValidator(require_uint256(_validatorLength() - 1));
        }
    }

invariant consistencyKeyExecutor(address module)
    _executorContains(module) => (
        _executorPositionOf(module) > 0 &&
        _executorPositionOf(module) <= _executorLength() &&
        _executorAt(require_uint256(_executorPositionOf(module) - 1)) == module
    )
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved {
            require moduleLengthSanity();
        }
        preserved uninstallModule(uint256 moduleTypeId, address otherModule, bytes deInitData) with (env e) {
            requireInvariant consistencyKeyExecutor(otherModule);
            requireInvariant atUniquenessExecutor(
                require_uint256(_executorPositionOf(module) - 1),
                require_uint256(_executorPositionOf(otherModule) - 1)
            );
            requireInvariant cleanStorageExecutor(require_uint256(_executorLength() - 1));
        }
    }

invariant absentValidatorIsNotStored(address module, uint256 index)
    index < _validatorLength() => (!_validatorContains(module) => _validatorAt(index) != module)
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved uninstallModule(uint256 moduleTypeId, address otherModule, bytes deInitData) with (env e) {
            requireInvariant consistencyIndexValidator(index);
            requireInvariant consistencyKeyValidator(module);
            requireInvariant atUniquenessValidator(index, require_uint256(_validatorLength() - 1));
            requireInvariant cleanStorageValidator(require_uint256(_validatorLength() - 1));
        }
    }

invariant absentExecutorIsNotStored(address module, uint256 index)
    index < _executorLength() => (!_executorContains(module) => _executorAt(index) != module)
    filtered { f -> f.selector != sig:execute(bytes32,bytes).selector  && f.selector != sig:executeFromExecutor(bytes32,bytes).selector }
    {
        preserved uninstallModule(uint256 moduleTypeId, address otherModule, bytes deInitData) with (env e) {
            requireInvariant consistencyIndexExecutor(index);
            requireInvariant consistencyKeyExecutor(module);
            requireInvariant atUniquenessExecutor(index, require_uint256(_executorLength() - 1));
            requireInvariant cleanStorageExecutor(require_uint256(_executorLength() - 1));
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  Module management                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// This guarantees that at most one fallback module is active for a given initData (i.e. selector)
rule fallbackModule(address module, bytes initData) {
    assert isModuleInstalled(FALLBACK_TYPE(), module, initData) <=> (initData.length >= 4 && getFallbackHandler(getDataSelector(initData)) == module);
}

rule moduleManagementRule(env e, method f, calldataarg args, uint256 moduleTypeId, address module, bytes additionalContext)
    filtered { f -> !f.isView }
{
    bytes context;
    require context.length == 0;

    bool isEntryPoint = isEntryPoint(e);
    bool isEntryPointOrSelf = isEntryPointOrSelf(e);
    bool isExecutionModule = isExecutionModule(e, context);

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
    requireInvariant consistencyKeyExecutor(module);
    requireInvariant consistencyKeyValidator(module);
    requireInvariant consistencyKeyExecutor(otherModule);
    requireInvariant consistencyKeyValidator(otherModule);

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
            moduleTypeId == FALLBACK_TYPE() &&
            otherModuleTypeId == FALLBACK_TYPE() &&
            otherModule == 0 && // when a fallback module is installed, the 0 module is "removed" for that selector
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

    requireInvariant consistencyKeyExecutor(module);
    requireInvariant consistencyKeyValidator(module);
    requireInvariant consistencyKeyExecutor(otherModule);
    requireInvariant consistencyKeyValidator(otherModule);
    requireInvariant consistencyIndexExecutor(require_uint256(_executorLength() - 1));
    requireInvariant consistencyIndexValidator(require_uint256(_validatorLength() - 1));

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
            moduleTypeId == FALLBACK_TYPE() &&
            otherModuleTypeId == FALLBACK_TYPE() &&
            otherModule == 0 && // when a fallback module is uninstalled, the 0 module is "added" for that selector
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
persistent ghost mathint calls;
persistent ghost address lastcall_target;
persistent ghost uint32  lastcall_selector;
persistent ghost uint256 lastcall_value;
persistent ghost uint256 lastcall_argsLength;

hook CALL(uint256 gas, address target, uint256 value, uint256 argsOffset, uint256 argsLength, uint256 retOffset, uint256 retLength) uint256 rc {
    if (executingContract == currentContract) {
        calls = calls + 1;
        lastcall_target     = target;
        lastcall_selector   = selector;
        lastcall_value      = value;
        lastcall_argsLength = argsLength;
    }
}

rule callOpcodeRule(env e, method f, calldataarg args)
    filtered { f -> !f.isView }
{
    require calls == 0;

    bytes context;
    require context.length == 0;

    bool isEntryPoint = isEntryPoint(e);
    bool isEntryPointOrSelf = isEntryPointOrSelf(e);
    bool isExecutionModule = isExecutionModule(e, context);

    f(e, args);

    assert calls > 0 => (
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
            calls == 1 &&
            lastcall_selector == 0x6d61fe70 && // onInstall(bytes)
            lastcall_value == 0
        ) || (
            // Can only call a module without any value. Target is verified by `callInstallModule`.
            f.selector == sig:uninstallModule(uint256,address,bytes).selector &&
            isEntryPointOrSelf &&
            calls == 1 &&
            lastcall_selector == 0x8a91b0e3 && // onUninstall(bytes)
            lastcall_value == 0
        ) || (
            // Can send payment to the entrypoint or perform an external signature verification.
            f.selector == sig:validateUserOp(Account.PackedUserOperation,bytes32,uint256).selector &&
            isEntryPoint &&
            calls <= 2 &&
            (
                (
                    // payPrefund (target is entryPoint and argsLength is 0)
                    lastcall_target == entryPoint() &&
                    lastcall_value > 0 &&
                    lastcall_argsLength == 0
                ) || (
                    // isValidSignatureWithSender (target is as validation module)
                    isModuleInstalled(VALIDATOR_TYPE(), lastcall_target, context) &&
                    lastcall_selector == 0x97003203 && // validateUserOp(Account.PackedUserOperation,bytes32)
                    lastcall_value == 0
                )
            )
        ) || (
            // Arbitrary fallback, to the correct fallback handler
            f.isFallback &&
            calls == 1 &&
            lastcall_target == getFallbackHandler(to_bytes4(lastcall_selector)) &&
            lastcall_value == e.msg.value
        )
    );
}

rule callInstallModule(env e, uint256 moduleTypeId, address module, bytes initData) {
    require calls == 0;

    installModule(e, moduleTypeId, module, initData);

    assert calls             == 1;
    assert lastcall_target   == module;
    assert lastcall_selector == 0x6d61fe70; // onInstall(bytes)
    assert lastcall_value    == 0;
}

rule callUninstallModule(env e, uint256 moduleTypeId, address module, bytes deInitData) {
    require calls == 0;

    uninstallModule(e, moduleTypeId, module, deInitData);

    assert calls             == 1;
    assert lastcall_target   == module;
    assert lastcall_selector == 0x8a91b0e3; // onUninstall(bytes)
    assert lastcall_value    == 0;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                 DELEGATECALL OPCODE                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
persistent ghost mathint delegatecalls;
persistent ghost address lastdelegatecall_target;
persistent ghost uint32  lastdelegatecall_selector;
persistent ghost uint256 lastdelegatecall_argsLength;

hook DELEGATECALL(uint256 gas, address target, uint256 argsOffset, uint256 argsLength, uint256 retOffset, uint256 retLength) uint256 rc {
    if (executingContract == currentContract) {
        delegatecalls = delegatecalls + 1;
        lastdelegatecall_target     = target;
        lastdelegatecall_selector   = selector;
        lastdelegatecall_argsLength = argsLength;
    }
}

rule delegatecallOpcodeRule(env e, method f, calldataarg args)
    filtered { f -> !f.isView }
{
    require delegatecalls == 0;

    bytes context;
    require context.length == 0;

    bool isEntryPoint = isEntryPoint(e);
    bool isEntryPointOrSelf = isEntryPointOrSelf(e);
    bool isExecutionModule = isExecutionModule(e, context);

    f(e, args);

    assert delegatecalls > 0 => (
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

    assert balanceBefore - balanceAfter <= missingAccountFunds;
}
