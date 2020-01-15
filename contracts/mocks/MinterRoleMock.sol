pragma solidity ^0.6.0;

import "../access/roles/MinterRole.sol";

contract MinterRoleMock is MinterRole {
    function removeMinter(address account) public {
        _removeMinter(account);
    }

    function onlyMinterMock() public view onlyMinter {
        // solhint-disable-previous-line no-empty-blocks
    }
}
