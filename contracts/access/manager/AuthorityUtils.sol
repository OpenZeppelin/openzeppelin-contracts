// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/manager/AuthorityUtils.sol)

pragma solidity ^0.8.20;

import {IAuthority} from "./IAuthority.sol";
import {LowLevelCalls} from "../../utils/LowLevelCalls.sol";
import {LowLevelMemory} from "../../utils/LowLevelMemory.sol";

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
        // snapshot free memory pointer (moved by encodeCall and getReturnDataFixed)
        LowLevelMemory.FreePtr ptr = LowLevelMemory.save();

        if (LowLevelCalls.staticcall(authority, abi.encodeCall(IAuthority.canCall, (caller, target, selector)))) {
            if (LowLevelCalls.getReturnDataSize() >= 0x40) {
                (immediate, delay) = abi.decode(LowLevelCalls.getReturnDataFixed(0x40), (bool, uint32));
            } else if (LowLevelCalls.getReturnDataSize() >= 0x20) {
                immediate = abi.decode(LowLevelCalls.getReturnDataFixed(0x20), (bool));
            }
        }

        // restore free memory pointer to reduce memory leak
        LowLevelMemory.load(ptr);

        return (immediate, delay);
    }
}
