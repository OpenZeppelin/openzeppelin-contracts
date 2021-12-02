// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Votes.sol";

contract VotesMock is Votes {

    constructor(string memory name)EIP712(name, "1") {}

    function getVotes(address account) public view returns (uint256) {
        return _getVotes(account);
    }

    function getVotesAt(address account, uint256 timestamp) public view returns (uint256) {
        return _getPastVotes(account, timestamp);
    }

    function getTotalAccountVotesAt(address account, uint32 pos) public view returns (Checkpoints.Checkpoint memory) {
        return _getTotalAccountVotesAt(account, pos);
    }

    function getTotalVotes() public view returns (uint256) {
        return _getTotalVotes();
    }

    function getTotalAccountVotes(address account) public view returns (uint256) {
        return _getTotalAccountVotes(account);
    }

    function getTotalVotesAt(uint256 timestamp) public view returns (uint256) {
        return getPastTotalSupply(timestamp);
    }

    function delegates(address account) public view returns (address) {
        return _delegates(account);
    }

    function delegate(
        address account,
        address newDelegation,
        uint256 balance
    ) public {
        return _delegate(account, newDelegation, balance);
    }

    function _getDelegatorVotes(address) internal virtual override returns(uint256){
        return 1;
    }

    function giveVotingPower(address account, uint8 amount) external {
        _moveVotingPower(address(0), _delegates(account), amount);
    }
}
