methods {
    // view
    function getVotes(address)              external returns (uint256) envfree;
    function getPastVotes(address, uint256) external returns (uint256);
    function getPastTotalSupply(uint256)    external returns (uint256);
    function delegates(address)             external returns (address) envfree;

    // external
    function delegate(address) external;
    function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32) external;
}
