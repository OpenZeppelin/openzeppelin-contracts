// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "../governance/extensions/GovernorVotesUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract GovernorVoteMocksUpgradeable is Initializable, GovernorVotesUpgradeable, GovernorCountingSimpleUpgradeable {
    function __GovernorVoteMocks_init(string memory name_, IVotesUpgradeable token_) internal onlyInitializing {
        __Context_init_unchained();
        __ERC165_init_unchained();
        __EIP712_init_unchained(name_, version());
        __IGovernor_init_unchained();
        __Governor_init_unchained(name_);
        __GovernorVotes_init_unchained(token_);
        __GovernorCountingSimple_init_unchained();
        __GovernorVoteMocks_init_unchained(name_, token_);
    }

    function __GovernorVoteMocks_init_unchained(string memory, IVotesUpgradeable) internal onlyInitializing {}

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
        override(IGovernorUpgradeable, GovernorVotesUpgradeable)
        returns (uint256)
    {
        return super.getVotes(account, blockNumber);
    }
    uint256[50] private __gap;
}
