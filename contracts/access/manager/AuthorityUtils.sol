// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/manager/AuthorityUtils.sol)

pragma solidity ^0.8.20;

import {IAuthority} from "./IAuthority.sol";
import {Memory} from "../../utils/Memory.sol";
import {LowLevelCall} from "../../utils/LowLevelCall.sol";

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
        Memory.Pointer ptr = Memory.getFreePointer();
        bytes memory params = abi.encodeCall(IAuthority.canCall, (caller, target, selector));
        (bool success, bytes32 immediateWord, bytes32 delayWord) = LowLevelCall.staticcallReturnBytes32Pair(
            authority,
            params
        );
        Memory.setFreePointer(ptr);

        if (!success) {
            return (false, 0);
        }

        return (
            uint256(immediateWord) != 0,
            uint32(uint256(delayWord)) // Intentional overflow to truncate the higher 224 bits
        );
    }
}
