methods {
    function owner() external returns (address) envfree;
    function pendingOwner() external returns (address) envfree;
    function transferOwnership(address) external;
    function acceptOwnership() external;
    function renounceOwnership() external;
}
