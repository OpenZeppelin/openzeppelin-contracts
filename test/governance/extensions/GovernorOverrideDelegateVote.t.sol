// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC20VotesOverridableMock} from "@openzeppelin/contracts/mocks/token/ERC20VotesOverridableMock.sol";
import {GovernorOverrideMock} from "@openzeppelin/contracts/mocks/governance/GovernorOverrideMock.sol";

contract GovernorOverrideDelegateVoteTest is Test {
    ERC20VotesOverridableMock token;
    GovernorOverrideMock governor;

    function setUp() public {
        token = new ERC20VotesOverridableMock();
        governor = new GovernorOverrideMock(token, 10, 10, 10);
    }

    function testOverrideVote(address tokenHolder, address delegate) external {
        vm.assume(tokenHolder != address(0));
        vm.assume(delegate != address(0));
        vm.assume(delegate != tokenHolder);

        token.mint(tokenHolder, 1000);
        vm.prank(tokenHolder);
        token.delegate(delegate);

        vm.roll(block.number + 1);
        vm.prank(delegate);

        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        uint256 proposalId = governor.propose(targets, values, calldatas, "Mock Proposal");

        vm.roll(block.number + 20);
        vm.prank(delegate);
        governor.castVote(proposalId, 1);

        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(forVotes, 1000);

        vm.prank(tokenHolder);
        governor.castVoteWithReasonAndParams(
            proposalId,
            0,
            "My delegate made a bad decision",
            hex"23b70c8d0000000000000000000000000000000000000000"
        );
        (againstVotes, forVotes, abstainVotes) = governor.proposalVotes(proposalId);
        assertEq(againstVotes, 1000);
        assertEq(forVotes, 0);
    }
}
