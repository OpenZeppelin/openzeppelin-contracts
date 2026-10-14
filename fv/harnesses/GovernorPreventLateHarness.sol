// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IVotes} from "../patched/governance/utils/IVotes.sol";
import {TimelockController} from "../patched/governance/TimelockController.sol";
import {Governor} from "../patched/governance/Governor.sol";
import {GovernorCountingSimple} from "../patched/governance/extensions/GovernorCountingSimple.sol";
import {GovernorPreventLateQuorum} from "../patched/governance/extensions/GovernorPreventLateQuorum.sol";
import {GovernorTimelockControl} from "../patched/governance/extensions/GovernorTimelockControl.sol";
import {GovernorVotes} from "../patched/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "../patched/governance/extensions/GovernorVotesQuorumFraction.sol";

contract GovernorPreventLateHarness is
    Governor,
    GovernorCountingSimple,
    GovernorPreventLateQuorum,
    GovernorTimelockControl,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    constructor(
        IVotes token_,
        TimelockController timelock_,
        uint256 quorumNumeratorValue,
        uint48 initialVoteExtension
    )
        Governor("Harness")
        GovernorPreventLateQuorum(initialVoteExtension)
        GovernorTimelockControl(timelock_)
        GovernorVotes(token_)
        GovernorVotesQuorumFraction(quorumNumeratorValue)
    {}

    // Harness from Votes
    function token_getPastTotalSupply(uint256 timepoint) public view returns (uint256) {
        return token().getPastTotalSupply(timepoint);
    }

    function token_getPastVotes(address account, uint256 timepoint) public view returns (uint256) {
        return token().getPastVotes(account, timepoint);
    }

    function token_clock() public view returns (uint48) {
        return token().clock();
    }

    function token_CLOCK_MODE() public view returns (string memory) {
        return token().CLOCK_MODE();
    }

    // Harness from Governor
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public pure returns (uint256) {
        return hashProposal(targets, values, calldatas, keccak256(bytes(description)));
    }

    // Same as `state`, but returns 255 (instead of reverting) if the proposal doesn't exist
    function safeState(uint256 proposalId) public view returns (uint8) {
        return proposalSnapshot(proposalId) == 0 ? type(uint8).max : uint8(state(proposalId));
    }

    function getExecutor() public view returns (address) {
        return _executor();
    }

    function quorumReached(uint256 proposalId) public view returns (bool) {
        return _quorumReached(proposalId);
    }

    function voteSucceeded(uint256 proposalId) public view returns (bool) {
        return _voteSucceeded(proposalId);
    }

    function isExecuted(uint256 proposalId) public view returns (bool) {
        return _isExecuted(proposalId);
    }

    function isCanceled(uint256 proposalId) public view returns (bool) {
        return _isCanceled(proposalId);
    }

    function isQueued(uint256 proposalId) public view returns (bool) {
        return _proposalQueueId(proposalId) != bytes32(0);
    }

    function governanceCallLength() public view returns (uint256) {
        return _governanceCallLength();
    }

    // Harness from GovernorPreventLateQuorum
    function getExtendedDeadline(uint256 proposalId) public view returns (uint64) {
        return _getExtendedDeadline(proposalId);
    }

    // Harness from GovernorCountingSimple
    function getAgainstVotes(uint256 proposalId) public view returns (uint256) {
        (uint256 againstVotes, , ) = proposalVotes(proposalId);
        return againstVotes;
    }

    function getForVotes(uint256 proposalId) public view returns (uint256) {
        (, uint256 forVotes, ) = proposalVotes(proposalId);
        return forVotes;
    }

    function getAbstainVotes(uint256 proposalId) public view returns (uint256) {
        (, , uint256 abstainVotes) = proposalVotes(proposalId);
        return abstainVotes;
    }

    // Harness from GovernorTimelockControl: timelock configuration
    function hasTimelockProposerRole() public view returns (bool) {
        return _timelock.hasRole(_timelock.PROPOSER_ROLE(), address(this));
    }

    function isTimelockOperation(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public view returns (bool) {
        // Same salt as GovernorTimelockControl._timelockSalt (private)
        bytes32 salt = bytes20(address(this)) ^ descriptionHash;
        return _timelock.isOperation(_timelock.hashOperationBatch(targets, values, calldatas, 0, salt));
    }

    function timelockMinDelay() public view returns (uint256) {
        return _timelock.getMinDelay();
    }

    // Clock: GovernorVotes wraps the calls to the token in a try/catch (to fall back to block numbers), and the prover
    // cannot resolve the function selector of these calls. The tokens used in the harnesses implement ERC-6372, so the
    // fallback is not needed.
    function clock() public view override(Governor, GovernorVotes) returns (uint48) {
        return token().clock();
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view override(Governor, GovernorVotes) returns (string memory) {
        return token().CLOCK_MODE();
    }

    // Settings
    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block
    }

    function votingPeriod() public pure override returns (uint256) {
        return 45818; // 1 week
    }

    // The following functions are overrides required by Solidity.
    function quorum(uint256 timepoint) public view override(Governor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(timepoint);
    }

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function proposalDeadline(
        uint256 proposalId
    ) public view override(Governor, GovernorPreventLateQuorum) returns (uint256) {
        return super.proposalDeadline(proposalId);
    }

    function proposalNeedsQueuing(
        uint256 proposalId
    ) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _tallyUpdated(uint256 proposalId) internal override(Governor, GovernorPreventLateQuorum) {
        super._tallyUpdated(proposalId);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
}
