pragma solidity ^0.5.0;

import "../GSN/Context.sol";
import "../access/roles/RevokerRole.sol";

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account, to permanently
 * disable certain contract functions.
 *
 * This module is used through inheritance. It will make available the
 * modifier `whenNotRevoked`, which can be applied to
 * the functions of your contract. Note that they will not be revokable by
 * simply including this module, only once the modifier are put in place.
 */
contract Revokable is Context, RevokerRole {
    /**
     * @dev Emitted when the revoke is triggered by a revoker (`account`).
     */
    event Revoked(address account);

    bool private _revoked;

    /**
     * @dev Initializes the contract in not revoked state. Assigns the Revoker role
     * to the deployer.
     */
    constructor () internal {
        _revoked = false;
    }

    /**
     * @dev Returns true if the contract is revoked, and false otherwise.
     */
    function revoked() public view returns (bool) {
        return _revoked;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not revoked.
     */
    modifier whenNotRevoked() {
        require(!_revoked, "Revokable: revoked");
        _;
    }

    /**
     * @dev Called by a revoker to revoke, triggers revoked state.
     */
    function revoke() public onlyRevoker whenNotRevoked {
        _revoked = true;
        emit Revoked(_msgSender());
    }
}
