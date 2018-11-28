pragma solidity ^0.4.24;

import "../access/roles/CapperRole.sol";

contract CapperRoleMock is CapperRole {
    function removeCapper(address account) public {
        _removeCapper(account);
    }

    function onlyCapperMock() public view onlyCapper {
    }

    // Causes a compilation error if super._removeCapper is not internal
    function _removeCapper(address account) internal {
        super._removeCapper(account);
    }
}
