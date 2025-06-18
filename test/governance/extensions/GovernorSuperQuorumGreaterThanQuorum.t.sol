// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {
    GovernorVotesSuperQuorumFractionMock
} from "../../../contracts/mocks/governance/GovernorVotesSuperQuorumFractionMock.sol";
import {GovernorVotesQuorumFraction} from "../../../contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {
    GovernorVotesSuperQuorumFraction
} from "../../../contracts/governance/extensions/GovernorVotesSuperQuorumFraction.sol";
import {GovernorSettings} from "../../../contracts/governance/extensions/GovernorSettings.sol";
import {GovernorVotes} from "../../../contracts/governance/extensions/GovernorVotes.sol";
import {Governor} from "../../../contracts/governance/Governor.sol";
import {IVotes} from "../../../contracts/governance/utils/IVotes.sol";
import {ERC20VotesExtendedTimestampMock} from "../../../contracts/mocks/token/ERC20VotesAdditionalCheckpointsMock.sol";
import {EIP712} from "../../../contracts/utils/cryptography/EIP712.sol";
import {ERC20} from "../../../contracts/token/ERC20/ERC20.sol";

contract TokenMock is ERC20VotesExtendedTimestampMock {
    constructor() ERC20("Mock Token", "MTK") EIP712("Mock Token", "1") {}
}

/**
 * Main responsibility: expose the functions that are relevant to the simulation
 */
contract GovernorHandler is GovernorVotesSuperQuorumFractionMock {
    constructor(
        string memory name_,
        uint48 votingDelay_,
        uint32 votingPeriod_,
        uint256 proposalThreshold_,
        IVotes token_,
        uint256 quorumNumerator_,
        uint256 superQuorumNumerator_
    )
        Governor(name_)
        GovernorSettings(votingDelay_, votingPeriod_, proposalThreshold_)
        GovernorVotes(token_)
        GovernorVotesQuorumFraction(quorumNumerator_)
        GovernorVotesSuperQuorumFraction(superQuorumNumerator_)
    {}

    // solhint-disable-next-line func-name-mixedcase
    function $_updateSuperQuorumNumerator(uint256 newSuperQuorumNumerator) public {
        _updateSuperQuorumNumerator(newSuperQuorumNumerator);
    }

    // solhint-disable-next-line func-name-mixedcase
    function $_updateQuorumNumerator(uint256 newQuorumNumerator) public {
        _updateQuorumNumerator(newQuorumNumerator);
    }
}

contract GovernorSuperQuorumGreaterThanQuorum is Test {
    GovernorHandler private _governorHandler;

    function setUp() external {
        _governorHandler = new GovernorHandler(
            "GovernorName",
            0, // votingDelay
            1e4, // votingPeriod
            0, // proposalThreshold
            new TokenMock(), // token
            10, // quorumNumerator
            50 // superQuorumNumerator
        );

        // limit the fuzzer scope
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = GovernorHandler.$_updateSuperQuorumNumerator.selector;
        selectors[1] = GovernorHandler.$_updateQuorumNumerator.selector;

        targetContract(address(_governorHandler));
        targetSelector(FuzzSelector(address(_governorHandler), selectors));
    }

    // solhint-disable-next-line func-name-mixedcase
    function invariant_superQuorumGreaterThanQuorum() external view {
        assertGe(_governorHandler.superQuorumNumerator(), _governorHandler.quorumNumerator());
    }
}
