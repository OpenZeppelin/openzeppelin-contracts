// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {GovernorFractionalMock} from "@openzeppelin/contracts/mocks/governance/GovernorFractionalMock.sol";
import {ERC20VotesTimestampMock} from "@openzeppelin/contracts/mocks/token/ERC20VotesTimestampMock.sol";

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {GovernorCountingFractional} from "@openzeppelin/contracts/governance/extensions/GovernorCountingFractional.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";

import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract GovernorMock is GovernorFractionalMock {
    constructor(
        string memory name,
        uint48 votingDelay,
        uint32 votingPeriod,
        uint256 proposalThreshold,
        address tokenAddress,
        uint256 quorumNumeratorValue
    )
        GovernorVotesQuorumFraction(quorumNumeratorValue)
        GovernorVotes(IVotes(tokenAddress))
        GovernorSettings(votingDelay, votingPeriod, proposalThreshold)
        Governor(name)
    {}
}

contract TokenMock is ERC20VotesTimestampMock {
    constructor() ERC20("TokenMock", "TKN") EIP712("TokenMock", "1") {}

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}

contract GovernorCountingFractionalTest is Test {
    GovernorFractionalMock internal _governor;
    TokenMock internal _token;

    uint256 internal _proposerPrivateKey;
    uint256 internal _voterPrivateKey;

    address internal _proposer;
    address internal _voter;

    function setUp() public {
        _token = new TokenMock();
        _governor = new GovernorMock("OZ-Governor", 0, 99999, 0, address(_token), 10);

        _proposerPrivateKey = 0xA11CE;
        _voterPrivateKey = 0xB0B;

        _proposer = vm.addr(_proposerPrivateKey);
        _voter = vm.addr(_voterPrivateKey);
    }

    function createProposal() internal returns (uint256 proposalId) {
        address[] memory targets = new address[](1);
        targets[0] = address(this);

        uint256[] memory values = new uint256[](1);
        values[0] = 0;

        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(_proposer);
        proposalId = _governor.propose(targets, values, calldatas, "proposal description");

        vm.warp(block.timestamp + 1);
    }

    function testFractionalVotingTwice(uint32[3] memory votes) public {
        uint256 sumVotes = uint256(votes[0]) + uint256(votes[1]) + uint256(votes[2]);
        vm.assume(sumVotes > 0);

        _token.mint(_voter, sumVotes * 2);

        vm.prank(_voter);
        _token.delegate(_voter);

        vm.warp(block.timestamp + 1);

        uint256 proposalId = createProposal();

        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = _governor.proposalVotes(proposalId);

        assertTrue(againstVotes == 0 && forVotes == 0 && abstainVotes == 0);
        assertEq(_governor.hasVoted(proposalId, _voter), false);
        assertEq(_governor.usedVotes(proposalId, _voter), 0);

        vm.startPrank(_voter);
        // TODO: check emitted events
        _governor.castVoteWithReasonAndParams(
            proposalId,
            255,
            "no particular reason",
            abi.encodePacked(uint128(votes[0]), uint128(votes[1]), uint128(votes[2]))
        );
        _governor.castVoteWithReasonAndParams(
            proposalId,
            255,
            "no particular reason",
            abi.encodePacked(uint128(votes[0]), uint128(votes[1]), uint128(votes[2]))
        );

        (againstVotes, forVotes, abstainVotes) = _governor.proposalVotes(proposalId);

        assertTrue(
            againstVotes == uint256(votes[0]) * 2 &&
                forVotes == uint256(votes[1]) * 2 &&
                abstainVotes == uint256(votes[2]) * 2
        );
        assertEq(_governor.hasVoted(proposalId, _voter), true);
        assertEq(_governor.usedVotes(proposalId, _voter), sumVotes * 2);
    }

    function testFractionalThenNominal(uint32[3] memory fractional, uint160 nominal) public {
        uint256 sumVotes = uint256(fractional[0]) + uint256(fractional[1]) + uint256(fractional[2]);
        vm.assume(sumVotes > 0);
        vm.assume(nominal > 0);

        _token.mint(_voter, sumVotes + nominal);

        vm.prank(_voter);
        _token.delegate(_voter);

        vm.warp(block.timestamp + 1);

        uint256 proposalId = createProposal();

        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = _governor.proposalVotes(proposalId);

        assertTrue(againstVotes == 0 && forVotes == 0 && abstainVotes == 0);
        assertEq(_governor.hasVoted(proposalId, _voter), false);
        assertEq(_governor.usedVotes(proposalId, _voter), 0);

        vm.startPrank(_voter);
        // TODO: check emitted events
        _governor.castVoteWithReasonAndParams(
            proposalId,
            255,
            "no particular reason",
            abi.encodePacked(uint128(fractional[0]), uint128(fractional[1]), uint128(fractional[2]))
        );

        _governor.castVoteWithReason(proposalId, 0, "no particular reason");

        (againstVotes, forVotes, abstainVotes) = _governor.proposalVotes(proposalId);

        assertTrue(
            againstVotes == uint256(fractional[0]) + nominal &&
                forVotes == uint256(fractional[1]) &&
                abstainVotes == uint256(fractional[2])
        );
        assertEq(_governor.hasVoted(proposalId, _voter), true);
        assertEq(_governor.usedVotes(proposalId, _voter), sumVotes + nominal);
    }
}
