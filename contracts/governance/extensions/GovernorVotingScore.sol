// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";

abstract contract GovernorVotingScore is IGovernor {
    struct Voting {
        uint256 supply;
        uint256 score;
    }

    mapping (uint256 => Voting) private _votings;

    function maxScore() public view virtual returns (uint8) {
        return 100;
    }

    function requiredScore() public view virtual returns (uint8) {
        return 50;
    }

    function proposalWeight(uint256 proposalId) public view virtual override returns (uint256) {
        return _votings[proposalId].supply;
    }

    function proposalScore(uint256 proposalId) public view virtual returns (uint256) {
        return _votings[proposalId].score;
    }

    function _voteSuccess(uint256 proposalId) internal view virtual override returns (bool) {
        return _votings[proposalId].score >= _votings[proposalId].supply * requiredScore(); // > vs >=
    }

    function _pushVote(uint256 proposalId, uint8 support, uint256 weight) internal virtual override {
        require(support <= maxScore(), "ScoreVoting: voting over the maximum score");
        _votings[proposalId].supply += weight;
        _votings[proposalId].score  += weight * support;
    }
}
