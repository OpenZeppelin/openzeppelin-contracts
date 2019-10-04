pragma solidity ^0.5.0;


/**
 * @dev Wrappers over Solidity's uintXX casting operators with added overflow
 * checks.
 *
 * Downcasting from uint256 in Solidity does not revert by default on overflow. 
 * This can easily result in undesired exploitation or bugs, since developers
 * usually assume that overflows raise errors. `SafeCast` restores this intuition
 * by reverting the transaction when such an operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeCast {

    /**
     * @dev Returns the downcasted uint128 from uint256, reverting on
     * overflow (when the input is greater than largest uint128).
     *
     * Counterpart to Solidity's `uint128` operator.
     *
     * Requirements:
     * - input cannot overflow.
     */
    function toUint128(uint a) internal pure returns (uint128) {
        require(a < 2**128, "SafeCast: downcast overflow");
        return uint128(a);
    }

    /**
     * @dev Returns the downcasted uint64 from uint256, reverting on
     * overflow (when the input is greater than largest uint64).
     *
     * Counterpart to Solidity's `uint64` operator.
     *
     * Requirements:
     * - input cannot overflow.
     */
    function toUint64(uint a) internal pure returns (uint64) {
        require(a < 2**64, "SafeCast: downcast overflow");
        return uint64(a);
    }

    /**
     * @dev Returns the downcasted uint32 from uint256, reverting on
     * overflow (when the input is greater than largest uint32).
     *
     * Counterpart to Solidity's `uint32` operator.
     *
     * Requirements:
     * - input cannot overflow.
     */
    function toUint32(uint a) internal pure returns (uint32) {
        require(a < 2**32, "SafeCast: downcast overflow");
        return uint32(a);
    }

    /**
     * @dev Returns the downcasted uint16 from uint256, reverting on
     * overflow (when the input is greater than largest uint16).
     *
     * Counterpart to Solidity's `uint16` operator.
     *
     * Requirements:
     * - input cannot overflow.
     */
    function toUint16(uint a) internal pure returns (uint16) {
        require(a < 2**16, "SafeCast: downcast overflow");
        return uint16(a);
    }

    /**
     * @dev Returns the downcasted uint8 from uint256, reverting on
     * overflow (when the input is greater than largest uint8).
     *
     * Counterpart to Solidity's `uint8` operator.
     *
     * Requirements:
     * - input cannot overflow.
     */
    function toUint8(uint a) internal pure returns (uint8) {

        require(a < 2**8, "SafeCast: downcast overflow");
        return uint8(a);
    }
}
