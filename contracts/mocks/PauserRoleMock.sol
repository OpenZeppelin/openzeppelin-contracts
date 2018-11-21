pragma solidity ^0.4.24;

import "../access/roles/PauserRole.sol";

contract PauserRoleMock is PauserRole {
    function removePauser(address account) public {
        _removePauser(account);
    }

    function onlyPauserMock() public view onlyPauser {
    }

    // Causes a compilation error if super._removePauser is not internal
    function _removePauser(address account) internal {
        super._removePauser(account);
    }
}
