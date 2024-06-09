// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/manager/AuthorityUtils.sol)

pragma solidity ^0.8.20;

import {IAuthority} from "./IAuthority.sol";

library AuthorityUtils {
    /**
     * @dev Since `AccessManager` implements an extended IAuthority interface, invoking `canCall` with backwards compatibility
     * for the preexisting `IAuthority` interface requires special care to avoid reverting on insufficient return data.
     * This helper function takes care of invoking `canCall` in a backwards compatible way without reverting.
     */
    function canCallWithDelay(
        address authority,
        address caller,
        address target,
        bytes4 selector
    ) internal view returns (bool immediate, uint32 delay) {
        (bool success, ) = authority.staticcall(abi.encodeCall(IAuthority.canCall, (caller, target, selector)));
        if (success) {
            /// @solidity memory-safe-assembly
            assembly {
                if gt(returndatasize(), 0x1f) {
                    if gt(returndatasize(), 0x3f) {
                        returndatacopy(0x00, 0x20, 0x20)
                        delay := mload(0x00)
                    }

                    returndatacopy(0, 0, 0x20)
                    immediate := mload(0x00)
                }
            }
        }
        return (immediate, delay);
    }
}
