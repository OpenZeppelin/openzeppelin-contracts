// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "../access/manager/IAuthority.sol";
import "../access/manager/AccessManaged.sol";

contract SimpleAuthority is IAuthority {
    address allowedCaller;
    address allowedTarget;
    bytes4 allowedSelector;

    function setAllowed(address _allowedCaller, address _allowedTarget, bytes4 _allowedSelector) public {
        allowedCaller = _allowedCaller;
        allowedTarget = _allowedTarget;
        allowedSelector = _allowedSelector;
    }

    function canCall(address caller, address target, bytes4 selector) external view override returns (bool) {
        return caller == allowedCaller && target == allowedTarget && selector == allowedSelector;
    }
}

abstract contract AccessManagedMock is AccessManaged {
    event RestrictedRan();

    function restrictedFunction() public restricted {
        emit RestrictedRan();
    }
}
