// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../../token/ERC20/ERC20.sol";

abstract contract ERC20ExpiringApprovalMock is ERC20 {
    function maxApprovalDuration() public pure virtual override returns (uint32) {
        return 1 hours;
    }
}
