// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IAuthority.sol";

contract AccessManaged {
    event AuthorityUpdated(IAuthority indexed oldAuthority, IAuthority indexed newAuthority);

    IAuthority private _authority;

    modifier restricted() {
        require(_authority.canCall(msg.sender, address(this), msg.sig));
        _;
    }

    constructor(IAuthority initialAuthority) {
        _authority = initialAuthority;
    }

    function authority() public view virtual returns (IAuthority) {
        return _authority;
    }

    function setAuthority(IAuthority newAuthority) public virtual {
        require(msg.sender == address(_authority));
        IAuthority oldAuthority = _authority;
        _authority = newAuthority;
        emit AuthorityUpdated(oldAuthority, newAuthority);
    }
}
