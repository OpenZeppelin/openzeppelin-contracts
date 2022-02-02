// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.3.2 (utils/Timers.sol)

pragma solidity ^0.8.8;

/**
 * @dev Tooling for timepoints, timers and delays
 */
library Timers {
    enum Type { TIMESTAMP, BLOCKNUMBER }

    type Timer is uint64;

    function toTimer(uint64 timer, Type typeSelector) internal pure returns (Timer) {
        require(timer >> 63 == 0, 'Timer only support 63 bits values');
        return Timer.wrap(uint8(typeSelector) << 63 | timer);
    }

    function getType(Timer timer) internal pure returns (Type) {
        return Type(Timer.unwrap(timer) >> 63);
    }

    function getValue(Timer timer) internal pure returns (uint64) {
        return Timer.unwrap(timer) & (type(uint64).max >> 1);
    }

    function isUnset(Timer timer) internal pure returns (bool) {
        return getValue(timer) == 0;
    }

    function isStarted(Timer timer) internal pure returns (bool) {
        return getValue(timer) > 0;
    }

    function isPending(Timer timer) internal view returns (bool) {
        return getType(timer) == Type.TIMESTAMP
            ? getValue(timer) > block.timestamp
            : getValue(timer) > block.number;
    }

    function isExpired(Timer timer) internal view returns (bool) {
        return isStarted(timer) && !isPending(timer);
    }

    function unset() internal pure returns (Timer) {
        return Timer.wrap(0);
    }

    function never() internal pure returns (Timer) {
        return Timer.wrap(type(uint64).max);
    }

    type Timestamp is uint64;

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

    type BlockNumber is uint64;

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
