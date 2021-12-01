// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Votes.sol";

abstract contract VotesMock is Votes {

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
        return super.getTotalVotesAt(timestamp);
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

    function mint(address to, uint256 amount) public {
        return _mintVote(to, amount);
    }

    function burn(address from, uint256 amount) public {
        return _burnVote(from, amount);
    }

    function transfer(
        address from,
        address to,
        uint256 amount
    ) public {
        return _transferVote(from, to, amount);
    }
}
