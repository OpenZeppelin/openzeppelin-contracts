pragma solidity ^0.4.24;

import "../access/roles/SignerRole.sol";

contract SignerRoleMock is SignerRole {
    function removeSigner(address account) public {
        _removeSigner(account);
    }

    function onlySignerMock() public view onlySigner {
    }

    // Causes a compilation error if super._removeSigner is not internal
    function _removeSigner(address account) internal {
        super._removeSigner(account);
    }
}
