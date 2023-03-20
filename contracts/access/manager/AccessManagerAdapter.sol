// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessManager.sol";
import "../../utils/Address.sol";

/**
 * @dev This contract can be used to migrate existing {Ownable} or {AccessControl} contracts into an {AccessManager}
 * system.
 *
 * Ownable contracts can have their ownership transferred to an instance of this adapter. AccessControl contracts can
 * grant all roles to the adapter, while ideally revoking them from all other accounts. Subsequently, the permissions
 * for those contracts can be managed centrally and with function granularity in the {AccessManager} instance the
 * adapter is connected to.
 *
 * Permissioned interactions with thus migrated contracts must go through the adapter's {relay} function and will
 * proceed if the function is allowed for the caller in the AccessManager instance.
 */
contract AccessManagerAdapter {
    using Address for address;

    AccessManager private _manager;

    bytes32 private constant _DEFAULT_ADMIN_ROLE = 0;

    /**
     * @dev Initializes an adapter connected to an AccessManager instance.
     */
    constructor(AccessManager manager) {
        _manager = manager;
    }

    /**
     * @dev Relays a function call to the target contract. The call will be relayed if the AccessManager allows the
     * caller access to this function in the target contract, i.e. if the caller is in a team that is allowed for the
     * function, or if the caller is the default admin for the AccessManager. The latter is meant to be used for
     * ad hoc operations such as asset recovery.
     */
    function relay(address target, bytes memory data) external payable {
        bytes4 sig = bytes4(data);
        require(_manager.canCall(msg.sender, target, sig) || _manager.hasRole(_DEFAULT_ADMIN_ROLE, msg.sender));
        (bool ok, bytes memory result) = target.call{value: msg.value}(data);
        assembly {
            let result_pointer := add(32, result)
            let result_size := mload(result)
            switch ok
            case true {
                return(result_pointer, result_size)
            }
            default {
                revert(result_pointer, result_size)
            }
        }
    }
}
