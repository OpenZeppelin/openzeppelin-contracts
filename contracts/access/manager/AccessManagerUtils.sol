// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "./IAuthority.sol";
import "./ICondition.sol";

library AccessManagerUtils {
    function toMask(uint8 group) internal pure returns (bytes32) {
        return bytes32(1 << group);
    }

    function applyMask(bytes32 bitmap, bytes32 mask, bool value) internal pure returns (bytes32) {
        return value ? (bitmap | mask) : (bitmap & ~mask);
    }

    // address(0) is an error and should be checked
    function callerFromCondition(address condition) internal view returns (address) {
        (bool success, bytes memory returnData) = condition.staticcall(abi.encodeCall(ICondition.getCaller, ()));
        if (success && returnData.length == 0x20) {
            return abi.decode(returnData, (address));
        } else {
            return address(0);
        }
    }
}