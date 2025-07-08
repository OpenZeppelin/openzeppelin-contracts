import "helpers/helpers.spec";
import "methods/IAccount.spec";

// Harness
methods {
    function getFallbackHandler(bytes4) external returns (address) envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  Module management                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule moduleManagementRule(
    env e,
    method f,
    calldataarg args,
    uint256 moduleTypeId,
    address module,
    bytes additionalContext
) {
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

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                     CALL OPCODE                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost bool    call;
ghost address call_target;
ghost uint256 call_value;
ghost uint256 call_argsLength;

hook CALL(uint256 gas, address target, uint256 value, uint256 argsOffset, uint256 argsLength, uint256 retOffset, uint256 retLength) uint256 rc {
    call = true;
    call_target = target;
    call_value = value;
    call_argsLength = argsLength;
}

rule callOpcodeRule(
    env e,
    method f,
    calldataarg args
) {
    require !call;

    bytes context;
    require context.length == 0;

    bool isEntryPoint = e.msg.sender == entryPoint();
    bool isEntryPointOrSelf = e.msg.sender == entryPoint() || e.msg.sender == currentContract;
    bool isExecutionModule = isModuleInstalled(2, e.msg.sender, context);

    // For some reason, f.selector does not effectivelly match the msg.sig when f.isFallback
    // address fallbackHandler = getFallbackHandler(to_bytes4(f.selector));

    f(e, args);

    assert call => (
        (
            f.selector == sig:execute(bytes32,bytes).selector &&
            isEntryPointOrSelf
        ) || (
            f.selector == sig:executeFromExecutor(bytes32,bytes).selector &&
            isExecutionModule
        ) || (
            f.selector == sig:installModule(uint256,address,bytes).selector &&
            isEntryPointOrSelf &&
            call_value == 0
        ) || (
            f.selector == sig:uninstallModule(uint256,address,bytes).selector &&
            isEntryPointOrSelf &&
            call_value == 0
        ) || (
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
                    call_value == 0
                )
            )
        ) || (
            f.isFallback &&
            // fallbackHandler != 0 &&
            // call_target == fallbackHandler &&
            call_value == e.msg.value
        )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                 DELEGATECALL OPCODE                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost bool    delegatecall;
ghost address delegatecall_target;
ghost uint256 delegatecall_argsLength;

hook DELEGATECALL(uint256 gas, address target, uint256 argsOffset, uint256 argsLength, uint256 retOffset, uint256 retLength) uint256 rc {
    delegatecall = true;
    delegatecall_target = target;
    delegatecall_argsLength = argsLength;
}

rule delegatecallOpcodeRule(
    env e,
    method f,
    calldataarg args
) {
    require !delegatecall;

    bytes context;
    require context.length == 0;

    bool isEntryPoint = e.msg.sender == entryPoint();
    bool isEntryPointOrSelf = e.msg.sender == entryPoint() || e.msg.sender == currentContract;
    bool isExecutionModule = isModuleInstalled(2, e.msg.sender, context);

    f(e, args);

    assert delegatecall => (
        (
            f.selector == sig:execute(bytes32,bytes).selector &&
            isEntryPointOrSelf
        ) || (
            f.selector == sig:executeFromExecutor(bytes32,bytes).selector &&
            isExecutionModule
        )
    );
}
