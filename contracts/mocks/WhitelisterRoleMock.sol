pragma solidity ^0.5.0;

import "../access/roles/WhitelisterRole.sol";

contract WhitelisterRoleMock is WhitelisterRole {
    function removeWhitelister(address account) public {
        _removeWhitelister(account);
    }

    function onlyWhitelisterMock() public view onlyWhitelister {
        // solhint-disable-previous-line no-empty-blocks
    }

    // Causes a compilation error if super._removeWhitelister is not internal
    function _removeWhitelister(address account) internal {
        super._removeWhitelister(account);
    }
}
