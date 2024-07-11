// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountECDSA} from "./recovery/AccountECDSA.sol";

abstract contract Account7702 is AccountECDSA {
    function _isAuthorized(address user) internal view virtual override returns (bool) {
        return user == address(this);
    }
}
