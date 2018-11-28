pragma solidity ^0.4.24;

import "../access/roles/WhitelisteeRole.sol";

contract WhitelisteeRoleMock is WhitelisteeRole {
    function onlyWhitelisteeMock() public view onlyWhitelistee {
    }
}
