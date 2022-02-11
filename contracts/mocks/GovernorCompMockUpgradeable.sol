// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "../governance/extensions/GovernorVotesCompUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract GovernorCompMockUpgradeable is Initializable, GovernorVotesCompUpgradeable, GovernorCountingSimpleUpgradeable {
    function __GovernorCompMock_init(string memory name_, ERC20VotesCompUpgradeable token_) internal onlyInitializing {
        __EIP712_init_unchained(name_, version());
        __Governor_init_unchained(name_);
        __GovernorVotesComp_init_unchained(token_);
    }

    function __GovernorCompMock_init_unchained(string memory, ERC20VotesCompUpgradeable) internal onlyInitializing {}

    function quorum(uint256) public pure override returns (uint256) {
        return 0;
    }

    function votingDelay() public pure override returns (uint256) {
        return 4;
    }

    function votingPeriod() public pure override returns (uint256) {
        return 16;
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
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

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
