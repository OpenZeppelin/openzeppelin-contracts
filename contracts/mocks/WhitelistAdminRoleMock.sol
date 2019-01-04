pragma solidity ^0.5.0;

import "../access/roles/WhitelistAdminRole.sol";

contract WhitelistAdminRoleMock is WhitelistAdminRole {
    function removeWhitelistAdmin(address account) public {
        _removeWhitelistAdmin(account);
    }

    function onlyWhitelistAdminMock() public view onlyWhitelistAdmin {
    }

    // Causes a compilation error if super._removeWhitelistAdmin is not internal
    function _removeWhitelistAdmin(address account) internal {
        super._removeWhitelistAdmin(account);
    }
}
