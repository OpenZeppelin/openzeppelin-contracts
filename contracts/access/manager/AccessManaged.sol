// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {IAuthority} from "./IAuthority.sol";
import {IManaged} from "./IManaged.sol";
import {Context} from "../../utils/Context.sol";

abstract contract AccessManaged is Context, IManaged {
    address private _authority;

    constructor(address initialAuthority) {
        _setAuthority(initialAuthority);
    }

    modifier restricted() {
        _checkCanCall(_msgSender(), address(this), msg.sig);
        _;
    }

    function authority() public view virtual returns (address) {
        return _authority;
    }

    function updateAuthority(address newAuthority) public virtual {
        address caller = _msgSender();
        if (caller != authority()) {
            revert AccessManagedUnauthorized(caller);
        }
        _setAuthority(newAuthority);
    }

    function _setAuthority(address newAuthority) internal virtual {
        _authority = newAuthority;
        emit AuthorityUpdated(newAuthority);
    }

    function _checkCanCall(address caller, address target, bytes4 selector) internal view virtual {
        (bool allowed, uint32 delay) = IAuthority(authority()).canCall(caller, target, selector);
        if (!allowed || delay > 0) {
            revert AccessManagedUnauthorized(caller);
        }
    }
}
