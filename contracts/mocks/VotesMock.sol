// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/utils/Votes.sol";

contract VotesMock is Votes {
    mapping(address => uint256) private _votingUnits;

    constructor(string memory name) EIP712(name, "1") {}

    function getTotalSupply() public view returns (uint256) {
        return _getTotalSupply();
    }

    function delegate(address account, address newDelegation) public {
        return _delegate(account, newDelegation);
    }

    function _getVotingUnits(address account) internal view override returns (uint256) {
        return _votingUnits[account];
    }

    function mint(address account, uint256 votes) external {
        _votingUnits[account] += votes;
        _transferVotingUnits(address(0), account, votes);
    }

    function burn(address account, uint256 votes) external {
        _votingUnits[account] += votes;
        _transferVotingUnits(account, address(0), votes);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}
