// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Voting.sol";

contract VotingImpl {
    using Voting for Voting.Votes;

    Voting.Votes private _votes;

    function getVotes(address account) public view returns (uint256) {
        return _votes.getVotes(account);
    }

    function getVotesAt(address account, uint256 timestamp) public view returns (uint256) {
        return _votes.getVotesAt(account, timestamp);
    }

    function getTotalAccountVotesAt(address account, uint32 pos) public view returns (Checkpoints.Checkpoint memory) {
        return _votes.getTotalAccountVotesAt(account, pos);
    }

    function getTotalVotes() public view returns (uint256) {
        return _votes.getTotalVotes();
    }

    function getTotalAccountVotes(address account) public view returns (uint256) {
        return _votes.getTotalAccountVotes(account);
    }

    function getTotalVotesAt(uint256 timestamp) public view returns (uint256) {
        return _votes.getTotalVotesAt(timestamp);
    }

    function delegates(address account) public view returns (address) {
        return _votes.delegates(account);
    }

    function delegate(
        address account,
        address newDelegation,
        uint256 balance
    ) public {
        return _votes.delegate(account, newDelegation, balance);
    }

    function mint(address to, uint256 amount) public {
        return _votes.mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        return _votes.burn(from, amount);
    }

    function transfer(
        address from,
        address to,
        uint256 amount
    ) public {
        return _votes.transfer(from, to, amount);
    }
}
