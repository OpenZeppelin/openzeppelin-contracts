import "./IERC5313.spec"

methods {
    // === View ==
    
    // Default Admin
    defaultAdmin() returns(address) envfree
    pendingDefaultAdmin() returns(address, uint48) envfree
    
    // Default Admin Delay
    defaultAdminDelay() returns(uint48)
    pendingDefaultAdminDelay() returns(uint48, uint48)
    defaultAdminDelayIncreaseWait() returns(uint48) envfree
    
    // === Mutations ==

    // Default Admin
    beginDefaultAdminTransfer(address)
    cancelDefaultAdminTransfer()
    acceptDefaultAdminTransfer()

    // Default Admin Delay
    changeDefaultAdminDelay(uint48)
    rollbackDefaultAdminDelay()

    // == FV ==
    
    // Default Admin
    pendingDefaultAdmin_() returns (address) envfree
    pendingDefaultAdminSchedule_() returns (uint48) envfree
    
    // Default Admin Delay
    pendingDelay_() returns (uint48)
    pendingDelaySchedule_() returns (uint48)
    delayChangeWait_(uint48) returns (uint48)
}
