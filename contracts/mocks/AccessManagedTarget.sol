// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../access/manager/AccessManaged.sol";

abstract contract AccessManagedTarget is AccessManaged {

    event CalledRestricted(address caller);
    event CalledUnrestricted(address caller);

    function fnRestricted() public restricted() {
        emit CalledRestricted(msg.sender);
    }

    function fnUnrestricted() public {
        emit CalledUnrestricted(msg.sender);
    }
}