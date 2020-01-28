pragma solidity ^0.6.0;

import "../access/roles/WhitelistAdminRole.sol";

contract WhitelistAdminRoleMock is WhitelistAdminRole {
    function removeWhitelistAdmin(address account) public {
        _removeWhitelistAdmin(account);
    }

    function onlyWhitelistAdminMock() public view onlyWhitelistAdmin { }
}
