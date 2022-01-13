// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/compatibility/GovernorCompatibilityBravoUpgradeable.sol";
import "../governance/extensions/GovernorTimelockCompoundUpgradeable.sol";
import "../governance/extensions/GovernorSettingsUpgradeable.sol";
import "../governance/extensions/GovernorVotesCompUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract GovernorCompatibilityBravoMockUpgradeable is
    Initializable, GovernorCompatibilityBravoUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorTimelockCompoundUpgradeable,
    GovernorVotesCompUpgradeable
{
    function __GovernorCompatibilityBravoMock_init(
        string memory name_,
        ERC20VotesCompUpgradeable token_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 proposalThreshold_,
        ICompoundTimelockUpgradeable timelock_
    ) internal onlyInitializing {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __EIP712_init_unchained(name_, version());
        __IGovernor_init_unchained();
        __IGovernorTimelock_init_unchained();
        __IGovernorCompatibilityBravo_init_unchained();
        __Governor_init_unchained(name_);
        __GovernorCompatibilityBravo_init_unchained();
        __GovernorSettings_init_unchained(votingDelay_, votingPeriod_, proposalThreshold_);
        __GovernorTimelockCompound_init_unchained(timelock_);
        __GovernorVotesComp_init_unchained(token_);
        __GovernorCompatibilityBravoMock_init_unchained(name_, token_, votingDelay_, votingPeriod_, proposalThreshold_, timelock_);
    }

    function __GovernorCompatibilityBravoMock_init_unchained(
        string memory,
        ERC20VotesCompUpgradeable,
        uint256,
        uint256,
        uint256,
        ICompoundTimelockUpgradeable
    ) internal onlyInitializing {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(IERC165Upgradeable, GovernorUpgradeable, GovernorTimelockCompoundUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function quorum(uint256) public pure override returns (uint256) {
        return 0;
    }

    function state(uint256 proposalId)
        public
        view
        virtual
        override(IGovernorUpgradeable, GovernorUpgradeable, GovernorTimelockCompoundUpgradeable)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalEta(uint256 proposalId)
        public
        view
        virtual
        override(IGovernorTimelockUpgradeable, GovernorTimelockCompoundUpgradeable)
        returns (uint256)
    {
        return super.proposalEta(proposalId);
    }

    function proposalThreshold() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {
        return super.proposalThreshold();
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override(IGovernorUpgradeable, GovernorUpgradeable, GovernorCompatibilityBravoUpgradeable) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public virtual override(IGovernorTimelockUpgradeable, GovernorTimelockCompoundUpgradeable) returns (uint256) {
        return super.queue(targets, values, calldatas, salt);
    }

    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public payable virtual override(IGovernorUpgradeable, GovernorUpgradeable) returns (uint256) {
        return super.execute(targets, values, calldatas, salt);
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

    /**
     * @notice WARNING: this is for mock purposes only. Ability to the _cancel function should be restricted for live
     * deployments.
     */
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
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
        override(IGovernorUpgradeable, GovernorVotesCompUpgradeable)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }

    function _executor() internal view virtual override(GovernorUpgradeable, GovernorTimelockCompoundUpgradeable) returns (address) {
        return super._executor();
    }
    uint256[50] private __gap;
}
