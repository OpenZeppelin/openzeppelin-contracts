methods {
    // view
    getVotes(address)              returns (uint256)
    getPastVotes(address, uint256) returns (uint256)
    getPastTotalSupply(uint256)    returns (uint256)
    delegates(address)             returns (address) envfree

    // external
    delegate(address)
    delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32)
}