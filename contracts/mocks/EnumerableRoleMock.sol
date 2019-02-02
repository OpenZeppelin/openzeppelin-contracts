pragma solidity ^0.5.2;

import "../access/roles/EnumerableRole.sol";

contract EnumerableRoleMock is EnumerableRole {
    function removeEnumerable(address account) public {
        _removeEnumerable(account);
    }

    function onlyEnumerableMock() public view onlyEnumerable {
        // solhint-disable-previous-line no-empty-blocks
    }

    // Causes a compilation error if super._removeRole is not internal
    function _removeEnumerable(address account) internal {
        super._removeEnumerable(account);
    }
}
