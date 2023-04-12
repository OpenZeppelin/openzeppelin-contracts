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
    _pendingDefaultAdmin() returns (address)
    _pendingDefaultAdminSchedule() returns (uint48)
    
    // Default Admin Delay
    _pendingDelay() returns (uint48)
    _pendingDelaySchedule() returns (uint48)
}
