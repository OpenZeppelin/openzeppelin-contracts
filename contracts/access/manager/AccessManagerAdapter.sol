// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./AccessManager.sol";
import "../../utils/Address.sol";

contract AccessManagerAdapter {
    using Address for address;

    AccessManager private _manager;

    bytes32 private _DEFAULT_ADMIN_ROLE = 0;

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
