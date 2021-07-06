// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GovernorVotes.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from an {ERC20Votes} token and a quorum expressed as a
 * fraction of the total supply.
 *
 * _Available since v4.3._
 */
abstract contract GovernorVotesQuorumFractional is GovernorVotes {
    uint256 private _quorumRatio;

    event QuorumRatioUpdated(uint256 oldQuorumRatio, uint256 newQuorumRatio);

    constructor(uint256 quorumRatioValue) {
        _updateQuorumRatio(quorumRatioValue);
    }

    function quorumRatio() public view virtual returns (uint256) {
        return _quorumRatio;
    }

    function quorumRatioMax() public view virtual returns (uint256) {
        return 100;
    }

    function quorum(uint256 blockNumber) public view virtual override returns (uint256) {
        return (token.getPastTotalSupply(blockNumber) * quorumRatio()) / quorumRatioMax();
    }

    function updateQuorumRatio(uint256 newQuorumRatio) external virtual onlyGovernance() {
        _updateQuorumRatio(newQuorumRatio);
    }

    function _updateQuorumRatio(uint256 newQuorumRatio) internal virtual {
        require(newQuorumRatio <= quorumRatioMax(), "GovernorVotesQuorumFractional: quorumRatio over quorumRatioMax");

        uint256 oldQuorumRatio = _quorumRatio;
        _quorumRatio = newQuorumRatio;

        emit QuorumRatioUpdated(oldQuorumRatio, newQuorumRatio);
    }
}
