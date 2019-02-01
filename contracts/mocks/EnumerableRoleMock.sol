pragma solidity ^0.5.2;

import "../access/roles/EnumerableRole.sol";

contract EnumerableRoleMock is EnumerableRole {
    function removeRole(address account) public {
        _removeRole(account);
    }

    function onlyRoleMock() public view onlyRole {
        // solhint-disable-previous-line no-empty-blocks
    }

    // Causes a compilation error if super._removeRole is not internal
    function _removeRole(address account) internal {
        super._removeRole(account);
    }
}
