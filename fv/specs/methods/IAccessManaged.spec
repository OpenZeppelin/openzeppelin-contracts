methods {
    function authority()              external returns (address) envfree;
    function isConsumingScheduledOp() external returns (bytes4)  envfree;
    function setAuthority(address)    external;
}
