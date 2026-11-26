// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

import {AccessManager} from "../access/manager/AccessManager.sol";

contract AccessManagerMock is AccessManager {
    event CalledRestricted(address caller);
    event CalledUnrestricted(address caller);

    constructor(address initialAdmin) AccessManager(initialAdmin) {}

    function fnRestricted() public onlyAuthorized {
        emit CalledRestricted(msg.sender);
    }

    function fnUnrestricted() public {
        emit CalledUnrestricted(msg.sender);
    }
}
