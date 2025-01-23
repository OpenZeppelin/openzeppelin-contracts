methods {
    function owner() external returns (address) envfree;
    function transferOwnership(address) external;
    function renounceOwnership() external;
}
