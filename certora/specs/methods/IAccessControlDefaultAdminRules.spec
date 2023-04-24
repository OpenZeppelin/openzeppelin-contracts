import "./IERC5313.spec"

methods {
    defaultAdmin() returns(address) envfree
    pendingDefaultAdmin() returns(address, uint48) envfree
    defaultAdminDelayIncreaseWait() returns(uint48) envfree
}
