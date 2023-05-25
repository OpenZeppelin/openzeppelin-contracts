// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./IManaged.sol";

contract AccessManagedImmutable is IManaged {
    IAuthority public immutable authority;

    constructor(IAuthority _authority) {
        authority = _authority;
    }

    modifier restricted() {
        _checkCanCall(msg.sender, msg.sig);
        _;
    }

    function _checkCanCall(address caller, bytes4 selector) internal view virtual {
        require(authority.canCall(caller, address(this), selector), "AccessManaged: authority rejected");
    }
}
