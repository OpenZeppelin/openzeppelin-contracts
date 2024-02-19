// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Math} from "../math/Math.sol";
import {Arrays} from "../Arrays.sol";
import {Panic} from "../Panic.sol";

library CircularBuffer {
    struct Bytes32CircularBuffer {
        uint256 index;
        bytes32[] data;
    }

    function setup(Bytes32CircularBuffer storage self, uint256 length) internal {
        clear(self);
        Arrays.unsafeSetLength(self.data, length);
    }

    function clear(Bytes32CircularBuffer storage self) internal {
        self.index = 0;
    }

    function push(Bytes32CircularBuffer storage self, bytes32 value) internal {
        uint256 index = self.index++;
        uint256 length = self.data.length;
        Arrays.unsafeAccess(self.data, index % length).value = value;
    }

    function count(Bytes32CircularBuffer storage self) internal view returns (uint256) {
        return Math.min(self.index, self.data.length);
    }

    function size(Bytes32CircularBuffer storage self) internal view returns (uint256) {
        return self.data.length;
    }

    function last(Bytes32CircularBuffer storage self, uint256 i) internal view returns (bytes32) {
        uint256 index = self.index;
        if (index <= i) {
            Panic.panic(Panic.ARRAY_OUT_OF_BOUNDS);
        }
        return Arrays.unsafeAccess(self.data, (index - i - 1) % self.data.length).value;
    }

    function includes(Bytes32CircularBuffer storage self, bytes32 value) internal view returns (bool) {
        uint256 index = self.index;
        uint256 length = self.data.length;
        for (uint256 i = 1; i <= length; ++i) {
            if (i > index) {
                return false;
            } else if (Arrays.unsafeAccess(self.data, (index - i) % length).value == value) {
                return true;
            }
        }
        return false;
    }
}
