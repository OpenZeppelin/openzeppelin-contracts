// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Account} from "../Account.sol";

abstract contract Account7702 is Account {
    function _isAuthorized(address user) internal view virtual override returns (bool) {
        return user == address(this);
    }
}
