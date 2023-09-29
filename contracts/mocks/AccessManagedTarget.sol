// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccessManaged} from "../access/manager/AccessManaged.sol";

abstract contract AccessManagedTarget is AccessManaged {
    event CalledRestricted(address caller);
    event CalledUnrestricted(address caller);
    event CalledFallback(address caller);

    function fnRestricted() public restricted {
        emit CalledRestricted(msg.sender);
    }

    function fnUnrestricted() public {
        emit CalledUnrestricted(msg.sender);
    }

    fallback() external {
        emit CalledFallback(msg.sender);
    }
}
