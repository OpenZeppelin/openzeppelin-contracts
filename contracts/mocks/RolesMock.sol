pragma solidity ^0.4.24;

import "../access/Roles.sol";

contract RolesMock {
    using Roles for Roles.Role;

    Roles.Role private dummyRole;

    function add(address account) public {
        dummyRole.add(account);
    }

    function remove(address account) public {
        dummyRole.remove(account);
    }

    function has(address account) public view returns (bool) {
        return dummyRole.has(account);
    }
}
