// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControlBatch} from "../access/extensions/AccessControlBatch.sol";

contract AccessControlBatchMock is AccessControlBatch {
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }
}
