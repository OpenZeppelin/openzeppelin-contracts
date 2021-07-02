// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../Governor.sol";
import "../../token/ERC20/extensions/ERC20Votes.sol";
import "../../utils/math/Math.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from a Comp or {ERC20Votes} token.
 *
 * _Available since v4.3._
 */
abstract contract GovernorWithERC20Votes is Governor {
    ERC20Votes public immutable token;
    uint256 private _quorumRatio;

    event QuorumRatioUpdated(uint256 oldQuorumRatio, uint256 newQuorumRatio);

    constructor(address tokenAddress, uint256 quorumRatioValue) {
        token = ERC20Votes(tokenAddress);
        _quorumRatio = quorumRatioValue;
    }

    function quorumRatio() public view virtual returns (uint256) {
        return _quorumRatio;
    }

    function quorumRatioMax() public view virtual returns (uint256) {
        return 100;
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {IGovernor-getVotes}).
     */
    function getVotes(address account, uint256 blockNumber) public view virtual override returns (uint256) {
        return token.getPastVotes(account, blockNumber);
    }

    function quorum(uint256 blockNumber) public view virtual override returns (uint256) {
        return Math.max(1, (token.getPastTotalSupply(blockNumber) * quorumRatio()) / quorumRatioMax());
    }

    function updateQuorumRatio(uint256 newQuorumRatio) external virtual onlyGovernance() {
        uint256 oldQuorumRatio = _quorumRatio;
        _quorumRatio = newQuorumRatio;

        emit QuorumRatioUpdated(oldQuorumRatio, newQuorumRatio);
    }
}
