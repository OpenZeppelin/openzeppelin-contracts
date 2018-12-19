pragma solidity ^0.5.1;

import "../access/roles/WhitelistedRole.sol";

contract WhitelistedRoleMock is WhitelistedRole {
    function onlyWhitelistedMock() public view onlyWhitelisted {
    }
}
