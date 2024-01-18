// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "../patched/access/manager/IAccessManager.sol";
import "../patched/access/manager/AccessManaged.sol";

contract AccessManagedHarness is AccessManaged {
    bytes internal SOME_FUNCTION_CALLDATA = abi.encodeCall(this.someFunction, ());

    constructor(address initialAuthority) AccessManaged(initialAuthority) {}

    function someFunction() public restricted() {
        // Sanity for FV: the msg.data when calling this function should be the same as the data used when checking
        // the schedule. This is a reformulation of `msg.data == SOME_FUNCTION_CALLDATA` that focuses on the operation
        // hash for this call.
        require(
            IAccessManager(authority()).hashOperation(_msgSender(), address(this), msg.data)
            ==
            IAccessManager(authority()).hashOperation(_msgSender(), address(this), SOME_FUNCTION_CALLDATA)
        );
    }

    function authority_canCall_immediate(address caller) public view returns (bool result) {
        (result,) = AuthorityUtils.canCallWithDelay(authority(), caller, address(this), this.someFunction.selector);
    }

    function authority_canCall_delay(address caller) public view returns (uint32 result) {
        (,result) = AuthorityUtils.canCallWithDelay(authority(), caller, address(this), this.someFunction.selector);
    }

    function authority_getSchedule(address caller) public view returns (uint48) {
        IAccessManager manager = IAccessManager(authority());
        return manager.getSchedule(manager.hashOperation(caller, address(this), SOME_FUNCTION_CALLDATA));
    }
}
