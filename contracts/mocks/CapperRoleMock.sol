pragma solidity ^0.6.0;

import "../access/roles/CapperRole.sol";

contract CapperRoleMock is CapperRole {
    function removeCapper(address account) public {
        _removeCapper(account);
    }

    function onlyCapperMock() public view onlyCapper { }
}
