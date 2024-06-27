// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Memory} from "../utils/Memory.sol";

contract MemoryMock {
    bytes32 private _ptr;

    modifier _rememberPtr() {
        assembly ("memory-safe") {
            mstore(0x00, sload(_ptr.slot))
        }
        _;
    }

    function _setPointer(bytes32 ptr) public {
        _ptr = ptr;
    }

    function _setFreePointer(bytes32 ptr) public {
        _setPointer(ptr);
        return Memory.setFreePointer(Memory.Pointer.wrap(ptr));
    }

    function _getFreePointer() public view _rememberPtr returns (bytes32) {
        return Memory.Pointer.unwrap(Memory.getFreePointer());
    }
}
