// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "../access/manager/IAuthority.sol";
import "../access/manager/AccessManaged.sol";

contract SimpleAuthority is IAuthority {
    address _allowedCaller;
    address _allowedTarget;
    bytes4 _allowedSelector;

    function setAllowed(address allowedCaller, address allowedTarget, bytes4 allowedSelector) public {
        _allowedCaller = allowedCaller;
        _allowedTarget = allowedTarget;
        _allowedSelector = allowedSelector;
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
