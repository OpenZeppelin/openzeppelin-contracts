// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IAuthority} from "./IAuthority.sol";
import {IManaged} from "./IManaged.sol";

contract AccessManaged is IManaged {
    address private _authority;

    constructor(address initialAuthority) {
        _setAuthority(initialAuthority);
    }

    modifier restricted() {
        _checkCanCall(msg.sender, msg.sig);
        _;
    }

    function authority() public view virtual returns (address) {
        return _authority;
    }

    function updateAuthority(address newAuthority) public virtual {
        if (msg.sender != authority()) {
            revert AccessManagedUnauthorized(msg.sender);
        }
        _setAuthority(newAuthority);
    }

    function _setAuthority(address newAuthority) internal virtual {
        _authority = newAuthority;
        emit AuthorityUpdated(newAuthority);
    }

    function _checkCanCall(address caller, bytes4 selector) internal view virtual {
        (bool allowed, uint32 delay) = IAuthority(authority()).canCall(caller, address(this), selector);
        if (!allowed || delay > 0) {
            revert AccessManagedUnauthorized(caller);
        }
    }
}
