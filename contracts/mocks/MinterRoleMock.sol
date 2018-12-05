pragma solidity ^0.4.24;

import "../access/roles/MinterRole.sol";

contract MinterRoleMock is MinterRole {
    function removeMinter(address account) public {
        _removeMinter(account);
    }

    function onlyMinterMock() public view onlyMinter {
    }

    // Causes a compilation error if super._removeMinter is not internal
    function _removeMinter(address account) internal {
        super._removeMinter(account);
    }
}
