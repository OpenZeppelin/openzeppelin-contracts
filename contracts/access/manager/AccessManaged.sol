// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./IAuthority.sol";
import "./IManaged.sol";

contract AccessManagedImmutable is IManaged {
    address private _authority;

    event AuthorityUpdate(address newAuthority);
    error AccessManagedUnauthorized(address caller);

    constructor(address initialAuthority) {
        _setAuthority(initialAuthority);
    }

    modifier restricted() {
        _checkCanCall(msg.sender, msg.sig);
        _;
    }

    function authority() public view returns (address) {
        return address(_authority);
    }

    function updateAuthority(address newAuthority) public {
        if (msg.sender != _authority) {
            revert AccessManagedUnauthorized(msg.sender);
        }
        _setAuthority(newAuthority);
    }

    function _setAuthority(address newAuthority) internal virtual {
        _authority = newAuthority;
        emit AuthorityUpdate(newAuthority);
    }

    function _checkCanCall(address caller, bytes4 selector) internal view virtual {
        (bool allowed, uint32 delay) = IAuthority(_authority).canCall(caller, address(this), selector);
        if (!allowed || delay > 0) {
            revert AccessManagedUnauthorized(caller);
        }
    }
}
