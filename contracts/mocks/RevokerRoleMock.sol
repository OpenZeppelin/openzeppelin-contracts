pragma solidity ^0.5.0;

import "../access/roles/RevokerRole.sol";

contract RevokerRoleMock is RevokerRole {
    function removeRevoker(address account) public {
        _removeRevoker(account);
    }

    function onlyRevokerMock() public view onlyRevoker {
        // solhint-disable-previous-line no-empty-blocks
    }

    // Causes a compilation error if super._removeRevoker is not internal
    function _removeRevoker(address account) internal {
        super._removeRevoker(account);
    }
}
