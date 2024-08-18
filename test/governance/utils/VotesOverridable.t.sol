// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC20VotesOverridableMock} from "@openzeppelin/contracts/mocks/token/ERC20VotesOverridableMock.sol";

contract ERC20VotesOverrideMockTest is Test {
    ERC20VotesOverridableMock token;

    function setUp() public {
        token = new ERC20VotesOverridableMock();
    }

    function testGetPastBalanceOfCheckpointBalances(address tokenHolder) external {
        vm.assume(tokenHolder != address(0));

        uint256 timepoint1 = block.number;
        vm.roll(timepoint1 + 2);

        uint256 timepoint2 = block.number;
        token.mint(tokenHolder, 100);
        vm.roll(timepoint2 + 2);

        uint256 timepoint3 = block.number;
        token.mint(tokenHolder, 200);
        vm.roll(timepoint3 + 2);

        assertEq(token.getPastBalanceOf(tokenHolder, timepoint1), 0);
        assertEq(token.getPastBalanceOf(tokenHolder, timepoint2), 100);
        assertEq(token.getPastBalanceOf(tokenHolder, timepoint3), 300);
    }

    function testGetPastDelegateCheckpointDelegates(address delegatee, address delegate1, address delegate2) external {
        uint256 timepoint1 = block.number;
        vm.roll(timepoint1 + 2);

        uint256 timepoint2 = block.number;
        vm.prank(delegatee);
        token.delegate(delegate1);
        vm.roll(timepoint2 + 2);

        uint256 timepoint3 = block.number;
        vm.prank(delegatee);
        token.delegate(delegate2);
        vm.roll(timepoint3 + 2);

        assertEq(token.getPastDelegate(delegatee, timepoint1), address(0));
        assertEq(token.getPastDelegate(delegatee, timepoint2), delegate1);
        assertEq(token.getPastDelegate(delegatee, timepoint3), delegate2);
    }
}
