methods {
    TIMELOCK_ADMIN_ROLE()       returns (bytes32) envfree => DISPATCHER(true)
    PROPOSER_ROLE()             returns (bytes32) envfree => DISPATCHER(true)
    EXECUTOR_ROLE()             returns (bytes32) envfree => DISPATCHER(true)
    CANCELLER_ROLE()            returns (bytes32) envfree => DISPATCHER(true)
    isOperation(bytes32)        returns (bool)    envfree => DISPATCHER(true)
    isOperationPending(bytes32) returns (bool)    envfree => DISPATCHER(true)
    isOperationReady(bytes32)   returns (bool)            => DISPATCHER(true)
    isOperationDone(bytes32)    returns (bool)    envfree => DISPATCHER(true)
    getTimestamp(bytes32)       returns (uint256) envfree => DISPATCHER(true)
    getMinDelay()               returns (uint256) envfree => DISPATCHER(true)

    hashOperation(address, uint256, bytes, bytes32, bytes32)            returns(bytes32) envfree => DISPATCHER(true)
    hashOperationBatch(address[], uint256[], bytes[], bytes32, bytes32) returns(bytes32) envfree => DISPATCHER(true)

    schedule(address, uint256, bytes, bytes32, bytes32, uint256)            => DISPATCHER(true)
    scheduleBatch(address[], uint256[], bytes[], bytes32, bytes32, uint256) => DISPATCHER(true)
    execute(address, uint256, bytes, bytes32, bytes32)                      => DISPATCHER(true)
    executeBatch(address[], uint256[], bytes[], bytes32, bytes32)           => DISPATCHER(true)
    cancel(bytes32)                                                         => DISPATCHER(true)
    updateDelay(uint256)                                                    => DISPATCHER(true)
}