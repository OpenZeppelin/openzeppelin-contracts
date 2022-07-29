// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (utils/Checkpoints.sol)

pragma solidity ^0.8.0;

import "./math/Math.sol";
import "./math/SafeCast.sol";

/**
 * @dev This library defines the `History` struct, for checkpointing values as they change at different points in
 * time, and later looking up past values by block number. See {Votes} as an example.
 *
 * To create a history of checkpoints define a variable type `Checkpoints.History` in your contract, and store a new
 * checkpoint for the current transaction block using the {push} function.
 *
 * _Available since v4.5._
 */
library Checkpoints {
    struct Checkpoint224 {
        uint32 _key;
        uint224 _value;
    }

    function latest(Checkpoint224[] storage self) internal view returns (uint224) {
        uint256 pos = self.length;
        return pos == 0 ? 0 : _unsafeAccess(self, pos - 1)._value;
    }

    function push(
        Checkpoint224[] storage self,
        uint32 key,
        uint224 value
    ) internal returns (uint224, uint224) {
        uint256 pos = self.length;

        if (pos > 0) {
            // Use of memory is important here.
            Checkpoint224 memory last = _unsafeAccess(self, pos - 1);

            // Checkpoints keys must be increassing.
            require(last._key <= key, "Checkpoint: invalid key");

            // Update or push new checkpoint
            if (last._key == key) {
                _unsafeAccess(self, pos - 1)._value = value;
            } else {
                self.push(Checkpoint224({_key: key, _value: value}));
            }
            return (last._value, value);
        } else {
            self.push(Checkpoint224({_key: key, _value: value}));
            return (0, value);
        }
    }

    function lowerLookup(Checkpoint224[] storage self, uint32 key) internal view returns (uint224) {
        uint256 length = self.length;
        uint256 pos = _lowerDichotomicLookup(self, key, 0, length);
        return pos == length ? 0 : _unsafeAccess(self, pos)._value;
    }

    function upperLookup(Checkpoint224[] storage self, uint32 key) internal view returns (uint224) {
        uint256 length = self.length;
        uint256 pos = _upperDichotomicLookup(self, key, 0, length);
        return pos == 0 ? 0 : _unsafeAccess(self, pos - 1)._value;
    }

    function upperLookupRecent(Checkpoint224[] storage self, uint32 key) internal view returns (uint224) {
        uint256 length = self.length;
        uint256 offset = 1;

        while (offset <= length && _unsafeAccess(self, length - offset)._key > key) {
            offset <<= 1;
        }

        uint256 low = offset < length ? length - offset : 0;
        uint256 high = length - (offset >> 1);
        uint256 pos = _upperDichotomicLookup(self, key, low, high);

        return pos == 0 ? 0 : _unsafeAccess(self, pos - 1)._value;
    }

    function _upperDichotomicLookup(
        Checkpoint224[] storage self,
        uint32 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key > key) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high;
    }

    function _lowerDichotomicLookup(
        Checkpoint224[] storage self,
        uint32 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key < key) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return high;
    }

    function _unsafeAccess(Checkpoint224[] storage self, uint256 pos) private view returns (Checkpoint224 storage result) {
        assembly {
            mstore(0, self.slot)
            result.slot := add(keccak256(0, 0x20), pos)
        }
    }

    struct Checkpoint160 {
        uint96 _key;
        uint160 _value;
    }

    function latest(Checkpoint160[] storage self) internal view returns (uint160) {
        uint256 pos = self.length;
        return pos == 0 ? 0 : _unsafeAccess(self, pos - 1)._value;
    }

    function push(
        Checkpoint160[] storage self,
        uint96 key,
        uint160 value
    ) internal returns (uint160, uint160) {
        uint256 pos = self.length;

        if (pos > 0) {
            // Use of memory is important here.
            Checkpoint160 memory last = _unsafeAccess(self, pos - 1);

            // Checkpoints keys must be increassing.
            require(last._key <= key, "Checkpoint: invalid key");

            // Update or push new checkpoint
            if (last._key == key) {
                _unsafeAccess(self, pos - 1)._value = value;
            } else {
                self.push(Checkpoint160({_key: key, _value: value}));
            }
            return (last._value, value);
        } else {
            self.push(Checkpoint160({_key: key, _value: value}));
            return (0, value);
        }
    }

    function lowerLookup(Checkpoint160[] storage self, uint96 key) internal view returns (uint160) {
        uint256 length = self.length;
        uint256 pos = _lowerDichotomicLookup(self, key, 0, length);
        return pos == length ? 0 : _unsafeAccess(self, pos)._value;
    }

    function upperLookup(Checkpoint160[] storage self, uint96 key) internal view returns (uint160) {
        uint256 length = self.length;
        uint256 pos = _upperDichotomicLookup(self, key, 0, length);
        return pos == 0 ? 0 : _unsafeAccess(self, pos - 1)._value;
    }

    function upperLookupRecent(Checkpoint160[] storage self, uint96 key) internal view returns (uint224) {
        uint256 length = self.length;
        uint256 offset = 1;

        while (offset <= length && _unsafeAccess(self, length - offset)._key > key) {
            offset <<= 1;
        }

        uint256 low = offset < length ? length - offset : 0;
        uint256 high = length - (offset >> 1);
        uint256 pos = _upperDichotomicLookup(self, key, low, high);

        return pos == 0 ? 0 : _unsafeAccess(self, pos - 1)._value;
    }

    function _upperDichotomicLookup(
        Checkpoint160[] storage self,
        uint96 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key > key) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return high;
    }

    function _lowerDichotomicLookup(
        Checkpoint160[] storage self,
        uint96 key,
        uint256 low,
        uint256 high
    ) private view returns (uint256) {
        while (low < high) {
            uint256 mid = Math.average(low, high);
            if (_unsafeAccess(self, mid)._key < key) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return high;
    }

    function _unsafeAccess(Checkpoint160[] storage self, uint256 pos) private view returns (Checkpoint160 storage result) {
        assembly {
            mstore(0, self.slot)
            result.slot := add(keccak256(0, 0x20), pos)
        }
    }

    struct History {
        Checkpoint224[] _checkpoints;
    }

    /**
     * @dev Returns the value in the latest checkpoint, or zero if there are no checkpoints.
     */
    function latest(History storage self) internal view returns (uint256) {
        return latest(self._checkpoints);
    }

    /**
     * @dev Returns the value at a given block number. If a checkpoint is not available at that block, the closest one
     * before it is returned, or zero otherwise.
     */
    function getAtBlock(History storage self, uint256 blockNumber) internal view returns (uint256) {
        require(blockNumber < block.number, "Checkpoints: block not yet mined");

        return upperLookupRecent(self._checkpoints, SafeCast.toUint32(blockNumber));
    }

    /**
     * @dev Pushes a value onto a History so that it is stored as the checkpoint for the current block.
     *
     * Returns previous value and new value.
     */
    function push(History storage self, uint256 value) internal returns (uint256, uint256) {
        return push(self._checkpoints, SafeCast.toUint32(block.number), SafeCast.toUint224(value));
    }

    /**
     * @dev Pushes a value onto a History, by updating the latest value using binary operation `op`. The new value will
     * be set to `op(latest, delta)`.
     *
     * Returns previous value and new value.
     */
    function push(
        History storage self,
        function(uint256, uint256) view returns (uint256) op,
        uint256 delta
    ) internal returns (uint256, uint256) {
        return push(self, op(latest(self), delta));
    }
}
