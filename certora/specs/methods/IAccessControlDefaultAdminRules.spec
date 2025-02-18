import "./IERC5313.spec";

methods {
    // === View ==
    
    // Default Admin
    function defaultAdmin() external returns(address) envfree;
    function pendingDefaultAdmin() external returns(address, uint48) envfree;
    
    // Default Admin Delay
    function defaultAdminDelay() external returns(uint48);
    function pendingDefaultAdminDelay() external returns(uint48, uint48);
    function defaultAdminDelayIncreaseWait() external returns(uint48) envfree;
    
    // === Mutations ==

    // Default Admin
    function beginDefaultAdminTransfer(address) external;
    function cancelDefaultAdminTransfer() external;
    function acceptDefaultAdminTransfer() external;

    // Default Admin Delay
    function changeDefaultAdminDelay(uint48) external;
    function rollbackDefaultAdminDelay() external;

    // == FV ==
    
    // Default Admin
    function pendingDefaultAdmin_() external returns (address) envfree;
    function pendingDefaultAdminSchedule_() external returns (uint48) envfree;
    
    // Default Admin Delay
    function pendingDelay_() external returns (uint48);
    function pendingDelaySchedule_() external returns (uint48);
    function delayChangeWait_(uint48) external returns (uint48);
}
