// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../../contracts/utils/Strings.sol";
import "../../contracts/governance/Governor.sol";

contract GovernorInternalTest is Test, Governor {
    constructor() Governor("") {}

    function testValidDescriptionForProposer(string memory description, address proposer, bool includeProposer) public {
        if (includeProposer) {
            description = string.concat(description, "#proposer=", Strings.toHexString(proposer));
        }
        assertTrue(_isValidDescriptionForProposer(proposer, description));
    }

    function testInvalidDescriptionForProposer(
        string memory description,
        address commitProposer,
        address actualProposer
    ) public {
        vm.assume(commitProposer != actualProposer);
        description = string.concat(description, "#proposer=", Strings.toHexString(commitProposer));
        assertFalse(_isValidDescriptionForProposer(actualProposer, description));
    }

    // We don't need to truly implement implement the missing functions because we are just testing
    // internal helpers.

    function clock() public pure override returns (uint48) {}

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {}

    // solhint-disable-next-line func-name-mixedcase
    function COUNTING_MODE() public pure virtual override returns (string memory) {}

    function votingDelay() public pure virtual override returns (uint256) {}

    function votingPeriod() public pure virtual override returns (uint256) {}

    function quorum(uint256) public pure virtual override returns (uint256) {}

    function hasVoted(uint256, address) public pure virtual override returns (bool) {}

    function _quorumReached(uint256) internal pure virtual override returns (bool) {}

    function _voteSucceeded(uint256) internal pure virtual override returns (bool) {}

    function _getVotes(address, uint256, bytes memory) internal pure virtual override returns (uint256) {}

    function _countVote(uint256, address, uint8, uint256, bytes memory) internal virtual override {}
}
