// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IAuthority.sol";

/**
 * @dev This contract module makes available a {restricted} modifier. Functions decorated with this modifier will be
 * permissioned according to an "authority": a contract like {AccessManager} that follows the {IAuthority} interface,
 * implementing a policy that allows certain callers access to certain functions.
 *
 * IMPORTANT: The `restricted` modifier should never be used on `internal` functions, judiciously used in `public`
 * functions, and ideally only used in `external` functions. See {restricted}.
 */
contract AccessManaged {
    event AuthorityUpdated(IAuthority indexed oldAuthority, IAuthority indexed newAuthority);

    IAuthority private _authority;

    /**
     * @dev Restricts access to a function as defined by the connected Authority for this contract and the
     * caller and selector of the function that entered the contract.
     *
     * [IMPORTANT]
     * ====
     * In general, this modifier should only be used on `external` functions. It is okay to use it on `public` functions
     * that are used as external entry points and are not called internally. Unless you know what you're doing, it
     * should never be used on `internal` functions. Failure to follow these rules can have critical security
     * implications! This is because the permissions are determined by the function that entered the contract, i.e. the
     * function at the bottom of the call stack, and not the function where the modifier is visible in the source code.
     * ====
     */
    modifier restricted() {
        _checkCanCall(msg.sender, msg.sig);
        _;
    }

    /**
     * @dev Initializes the contract connected to an initial authority.
     */
    constructor(IAuthority initialAuthority) {
        _setAuthority(initialAuthority);
    }

    /**
     * @dev Returns the current authority.
     */
    function authority() public view virtual returns (IAuthority) {
        return _authority;
    }

    /**
     * @dev Transfers control to a new authority. The caller must be the current authority.
     */
    function setAuthority(IAuthority newAuthority) public virtual {
        require(msg.sender == address(_authority), "AccessManaged: not current authority");
        _setAuthority(newAuthority);
    }

    /**
     * @dev Transfers control to a new authority. Internal function with no access restriction.
     */
    function _setAuthority(IAuthority newAuthority) internal virtual {
        IAuthority oldAuthority = _authority;
        _authority = newAuthority;
        emit AuthorityUpdated(oldAuthority, newAuthority);
    }

    /**
     * @dev Reverts if the caller is not allowed to call the function identified by a selector.
     */
    function _checkCanCall(address caller, bytes4 selector) internal view virtual {
        require(_authority.canCall(caller, address(this), selector), "AccessManaged: authority rejected");
    }
}
