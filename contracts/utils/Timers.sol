// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.3.2 (utils/Timers.sol)

pragma solidity ^0.8.8;

/**
 * @dev Tooling for timepoints, timers and delays
 */
library Timers {
    type Timestamp is uint64;
    type BlockNumber is uint64;

    function toTimestamp(uint64 timer) internal pure returns (Timestamp) {
        return Timestamp.wrap(timer);
    }

    function toUint64(Timestamp timer) internal pure returns (uint64) {
        return Timestamp.unwrap(timer);
    }

    function isUnset(Timestamp timer) internal pure returns (bool) {
        return Timestamp.unwrap(timer) == 0;
    }

    function isStarted(Timestamp timer) internal pure returns (bool) {
        return Timestamp.unwrap(timer) > 0;
    }

    function isPending(Timestamp timer) internal view returns (bool) {
        return Timestamp.unwrap(timer) > block.timestamp;
    }

    function isExpired(Timestamp timer) internal view returns (bool) {
        return isStarted(timer) && Timestamp.unwrap(timer) <= block.timestamp;
    }

    function toBlockNumber(uint64 timer) internal pure returns (BlockNumber) {
        return BlockNumber.wrap(timer);
    }

    function toUint64(BlockNumber timer) internal pure returns (uint64) {
        return BlockNumber.unwrap(timer);
    }

    function isUnset(BlockNumber timer) internal pure returns (bool) {
        return BlockNumber.unwrap(timer) == 0;
    }

    function isStarted(BlockNumber timer) internal pure returns (bool) {
        return BlockNumber.unwrap(timer) > 0;
    }

    function isPending(BlockNumber timer) internal view returns (bool) {
        return BlockNumber.unwrap(timer) > block.number;
    }

    function isExpired(BlockNumber timer) internal view returns (bool) {
        return isStarted(timer) && BlockNumber.unwrap(timer) <= block.number;
    }
}
