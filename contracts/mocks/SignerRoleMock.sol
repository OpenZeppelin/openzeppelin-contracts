pragma solidity ^0.6.0;

import "../access/roles/SignerRole.sol";

contract SignerRoleMock is SignerRole {
    function removeSigner(address account) public {
        _removeSigner(account);
    }

    function onlySignerMock() public view onlySigner { }
}
