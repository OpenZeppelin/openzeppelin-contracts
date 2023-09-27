// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../patched/access/manager/IAccessManager.sol";
import "../patched/access/manager/AccessManaged.sol";

contract AccessManagedHarness is AccessManaged {
    constructor(address initialAuthority) AccessManaged(initialAuthority) {}

    function someFunction() public restricted() {}

    function authority_canCall_1(address caller) public view returns (bool result) {
        (result,) = AuthorityUtils.canCallWithDelay(authority(), caller, address(this), this.someFunction.selector);
    }

    function authority_canCall_2(address caller) public view returns (uint32 result) {
        (,result) = AuthorityUtils.canCallWithDelay(authority(), caller, address(this), this.someFunction.selector);
    }

    function authority_getSchedule(address caller) public view returns (uint48) {
        IAccessManager manager = IAccessManager(authority());
        return manager.getSchedule(manager.hashOperation(caller, address(this), abi.encodeCall(this.someFunction, ())));
    }
}
