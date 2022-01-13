// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorTimelockCompoundUpgradeable.sol";
import "../governance/extensions/GovernorSettingsUpgradeable.sol";
import "../governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "../governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract GovernorTimelockCompoundMockUpgradeable is
    Initializable, GovernorSettingsUpgradeable,
    GovernorTimelockCompoundUpgradeable,
    GovernorVotesQuorumFractionUpgradeable,
    GovernorCountingSimpleUpgradeable
{
    function __GovernorTimelockCompoundMock_init(
        string memory name_,
        IVotesUpgradeable token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        ICompoundTimelockUpgradeable timelock_,
        uint256 quorumNumerator_
    ) internal onlyInitializing {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __EIP712_init_unchained(name_, version());
        __IGovernor_init_unchained();
        __IGovernorTimelock_init_unchained();
        __Governor_init_unchained(name_);
        __GovernorSettings_init_unchained(votingDelay_, votingPeriod_, 0);
        __GovernorTimelockCompound_init_unchained(timelock_);
        __GovernorVotes_init_unchained(token_);
        __GovernorVotesQuorumFraction_init_unchained(quorumNumerator_);
        __GovernorCountingSimple_init_unchained();
        __GovernorTimelockCompoundMock_init_unchained(name_, token_, votingDelay_, votingPeriod_, timelock_, quorumNumerator_);
    }

    function __GovernorTimelockCompoundMock_init_unchained(
        string memory,
        IVotesUpgradeable,
        uint256,
        uint256,
        ICompoundTimelockUpgradeable,
        uint256
    ) internal onlyInitializing {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(GovernorUpgradeable, GovernorTimelockCompoundUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function quorum(uint256 blockNumber)
        public
        view
        override(IGovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
    }

    /**
     * Overriding nightmare
     */
    function state(uint256 proposalId)
        public
        view
        virtual
        override(GovernorUpgradeable, GovernorTimelockCompoundUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalThreshold() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {
        return super.proposalThreshold();
    }

    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override(GovernorUpgradeable, GovernorTimelockCompoundUpgradeable) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) internal virtual override(GovernorUpgradeable, GovernorTimelockCompoundUpgradeable) returns (uint256 proposalId) {
        return super._cancel(targets, values, calldatas, salt);
    }

    function getVotes(address account, uint256 blockNumber)
        public
        view
        virtual
        override(IGovernorUpgradeable, GovernorVotesUpgradeable)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function _executor() internal view virtual override(GovernorUpgradeable, GovernorTimelockCompoundUpgradeable) returns (address) {
        return super._executor();
    }
    uint256[50] private __gap;
}
