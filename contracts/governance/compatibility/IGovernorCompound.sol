// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../IGovernor.sol";

/**
 * @dev Interface extension that adds missing functions to the {Governor} core to provide `GovernorBravo` compatibility.
 *
 * _Available since v4.2._
 */
abstract contract IGovernorCompound is IGovernor {
    struct CompProposal {
        uint256 id;
        address proposer;
        uint256 eta;
        address[] targets;
        uint256[] values;
        string[] signatures;
        bytes[] calldatas;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool canceled;
        bool executed;
    }
    struct CompReceipt {
        bool hasVoted;
        uint8 support;
        uint96 votes;
    }

    // function votingDelay() external view returns (uint256); // part of IGovernor
    // function votingPeriod() external view returns (uint256); // part of IGovernor

    function quorumVotes() external view virtual returns (uint256);

    function proposals(uint256) external view virtual returns (CompProposal memory);

    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        string memory description
    ) external virtual returns (uint256);

    function queue(uint256 proposalId) external virtual;

    function execute(uint256 proposalId) external payable virtual;

    function getActions(uint256 proposalId)
        external
        view
        virtual
        returns (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory calldatas
        );

    function getReceipt(uint256 proposalId, address voter) external view virtual returns (CompReceipt memory);
}
