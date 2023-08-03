// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccessManaged} from "../AccessManaged.sol";
import {Address} from "../../../utils/Address.sol";

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
contract AccessManagedAdapter is AccessManaged {
    error AccessManagedAdapterUnauthorizedSelfRelay();

    /**
     * @dev Initializes an adapter connected to an AccessManager instance.
     */
    constructor(address initialAuthority) AccessManaged(initialAuthority) {}

    /**
     * @dev Relays a function call to the target contract. The call will be relayed if the AccessManager allows the
     * caller access to this function in the target contract, i.e. if the caller is a member of the group that is
     * allowed for the function.
     */
    function relay(address target, bytes calldata data) external payable {
        if (target == address(this)) {
            revert AccessManagedAdapterUnauthorizedSelfRelay();
        }

        _checkCanCall(_msgSender(), target, bytes4(data[0:4]));

        Address.functionCallWithValue(target, data, msg.value);
    }
}
