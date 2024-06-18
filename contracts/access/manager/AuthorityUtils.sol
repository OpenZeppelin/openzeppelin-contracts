// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/manager/AuthorityUtils.sol)

pragma solidity ^0.8.20;

import {IAuthority} from "./IAuthority.sol";
import {Memory} from "../../utils/Memory.sol";

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
        Memory.FreePtr ptr = Memory.save();

        bytes memory params = abi.encodeCall(IAuthority.canCall, (caller, target, selector));
        assembly ("memory-safe") {
            let success := staticcall(not(0), authority, add(params, 0x20), mload(params), 0, 0x40)
            if success {
                if gt(returndatasize(), 0x1F) {
                    immediate := gt(mload(0x00), 0)
                }
                if gt(returndatasize(), 0x3F) {
                    delay := and(mload(0x20), 0xFFFFFFFF)
                }
            }
        }

        Memory.load(ptr);
    }
}
