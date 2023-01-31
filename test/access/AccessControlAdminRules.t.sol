// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../contracts/access/AccessControlAdminRules.sol";

contract MyToken is AccessControlAdminRules {
    constructor(uint48 delay) AccessControlAdminRules(delay, _msgSender()) {}
}

contract AdminRules is Test {
    MyToken token;

    uint48 constant DELAY = 60 * 60 * 24;

    function testDeploy() public {
        token = new MyToken(DELAY);
    }
}
