// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {AuthorityUtils} from "@openzeppelin/contracts/access/manager/AuthorityUtils.sol";
import {AuthorityDelayMock} from "@openzeppelin/contracts/mocks/AuthorityMock.sol";

contract AuthorityUtilsTest is Test {
    AuthorityDelayMock internal _authority;

    function setUp() public {
        _authority = new AuthorityDelayMock();
    }

    function testAuthorityReturnDelay(uint32 delay, bool immediate) public {
        _authority._setImmediate(immediate);
        _authority._setDelay(delay);

        (bool _immediate, uint32 _delay) = AuthorityUtils.canCallWithDelay(
            address(_authority),
            address(this),
            address(this),
            hex"12345678"
        );
        assertEq(_immediate, immediate);
        assertEq(_delay, delay);
    }
}
