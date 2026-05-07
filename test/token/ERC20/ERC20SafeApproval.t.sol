/*
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC20SafeApprovalToken} from
    "../../../contracts/token/ERC20/extensions/ERC20SafeApprovalToken.sol";

contract ERC20SafeApprovalTest is Test {

    ERC20SafeApprovalToken token;

    address owner     = address(0x1);
    address spender   = address(0x2);
    address recipient = address(0x3);

    function setUp() public {
        // TODO: deploy token with initial cap and supply
    }

    // TODO: test normal approval within cap

    // TODO: test approval above cap reverts

    // TODO: test approveWithExpiry sets expiry correctly

    // TODO: test transferFrom before expiry succeeds

    // TODO: test transferFrom after expiry reverts

    // TODO: test combined cap + expiry case
}*/