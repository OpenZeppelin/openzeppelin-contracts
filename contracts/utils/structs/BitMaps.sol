// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/structs/BitMaps.sol)
// This file was procedurally generated from scripts/generate/templates/BitMaps.js.

pragma solidity ^0.8.20;

/**
 * @dev Library for managing bytes-based mappings in a compact and efficient way, provided the keys are sequential.
 * Largely inspired by Uniswap's https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol[merkle-distributor].
 *
 * The library provides several map types that pack multiple values into single 256-bit storage slots:
 *
 * * `BitMap`: 256 booleans per slot (1 bit each)
 * * `PairMap`: 128 2-bit values per slot
 * * `NibbleMap`: 64 4-bit values per slot
 * * `Uint8Map`: 32 8-bit values per slot
 * * `Uint16Map`: 16 16-bit values per slot
 * * `Uint32Map`: 8 32-bit values per slot
 * * `Uint64Map`: 4 64-bit values per slot
 * * `Uint128Map`: 2 128-bit values per slot
 *
 * This approach provides significant gas savings compared to using individual storage slots for each value:
 *
 * * Setting a zero value to non-zero only once every N times (where N is the packing density)
 * * Accessing the same warm slot for every N _sequential_ indices
 */
library BitMaps {
    struct BitMap {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns whether the bit at `index` is set.
     */
    function get(BitMap storage bitmap, uint256 index) internal view returns (bool) {
        uint256 bucket = index >> 8;
        uint256 mask = 1 << (index & 0xff);
        return bitmap._data[bucket] & mask != 0;
    }

    /**
     * @dev Sets the bit at `index` to the boolean `value`.
     */
    function setTo(BitMap storage bitmap, uint256 index, bool value) internal {
        if (value) {
            set(bitmap, index);
        } else {
            unset(bitmap, index);
        }
    }

    /**
     * @dev Sets the bit at `index`.
     */
    function set(BitMap storage bitmap, uint256 index) internal {
        uint256 bucket = index >> 8;
        uint256 mask = 1 << (index & 0xff);
        bitmap._data[bucket] |= mask;
    }

    /**
     * @dev Unsets the bit at `index`.
     */
    function unset(BitMap storage bitmap, uint256 index) internal {
        uint256 bucket = index >> 8;
        uint256 mask = 1 << (index & 0xff);
        bitmap._data[bucket] &= ~mask;
    }

    struct PairMap {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the 2-bit value at `index` in `map`.
     */
    function get(PairMap storage map, uint256 index) internal view returns (uint8) {
        uint256 bucket = index >> 7; // 128 values per bucket (256/2)
        uint256 shift = (index & 0x7f) << 1; // i.e. (index % 128) * 2 = position * 2
        return uint8((map._data[bucket] >> shift) & 0x03);
    }

    /**
     * @dev Sets the 2-bit value at `index` in `map`.
     *
     * NOTE: Assumes `value` fits in 2 bits. Assembly-manipulated values may corrupt adjacent data.
     */
    function set(PairMap storage map, uint256 index, uint8 value) internal {
        uint256 bucket = index >> 7; // 128 values per bucket (256/2)
        uint256 shift = (index & 0x7f) << 1; // i.e. (index % 128) * 2 = position * 2
        uint256 mask = 0x03 << shift;
        map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the 2 bits
    }

    struct NibbleMap {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the 4-bit value at `index` in `map`.
     */
    function get(NibbleMap storage map, uint256 index) internal view returns (uint8) {
        uint256 bucket = index >> 6; // 64 values per bucket (256/4)
        uint256 shift = (index & 0x3f) << 2; // i.e. (index % 64) * 4 = position * 4
        return uint8((map._data[bucket] >> shift) & 0x0f);
    }

    /**
     * @dev Sets the 4-bit value at `index` in `map`.
     *
     * NOTE: Assumes `value` fits in 4 bits. Assembly-manipulated values may corrupt adjacent data.
     */
    function set(NibbleMap storage map, uint256 index, uint8 value) internal {
        uint256 bucket = index >> 6; // 64 values per bucket (256/4)
        uint256 shift = (index & 0x3f) << 2; // i.e. (index % 64) * 4 = position * 4
        uint256 mask = 0x0f << shift;
        map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the 4 bits
    }

    struct Uint8Map {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the 8-bit value at `index` in `map`.
     */
    function get(Uint8Map storage map, uint256 index) internal view returns (uint8) {
        uint256 bucket = index >> 5; // 32 values per bucket (256/8)
        uint256 shift = (index & 0x1f) << 3; // i.e. (index % 32) * 8 = position * 8
        return uint8(map._data[bucket] >> shift);
    }

    /**
     * @dev Sets the 8-bit value at `index` in `map`.
     *
     * NOTE: Assumes `value` fits in 8 bits. Assembly-manipulated values may corrupt adjacent data.
     */
    function set(Uint8Map storage map, uint256 index, uint8 value) internal {
        uint256 bucket = index >> 5; // 32 values per bucket (256/8)
        uint256 shift = (index & 0x1f) << 3; // i.e. (index % 32) * 8 = position * 8
        uint256 mask = 0xff << shift;
        map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the 8 bits
    }

    struct Uint16Map {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the 16-bit value at `index` in `map`.
     */
    function get(Uint16Map storage map, uint256 index) internal view returns (uint16) {
        uint256 bucket = index >> 4; // 16 values per bucket (256/16)
        uint256 shift = (index & 0x0f) << 4; // i.e. (index % 16) * 16 = position * 16
        return uint16(map._data[bucket] >> shift);
    }

    /**
     * @dev Sets the 16-bit value at `index` in `map`.
     *
     * NOTE: Assumes `value` fits in 16 bits. Assembly-manipulated values may corrupt adjacent data.
     */
    function set(Uint16Map storage map, uint256 index, uint16 value) internal {
        uint256 bucket = index >> 4; // 16 values per bucket (256/16)
        uint256 shift = (index & 0x0f) << 4; // i.e. (index % 16) * 16 = position * 16
        uint256 mask = 0xffff << shift;
        map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the 16 bits
    }

    struct Uint32Map {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the 32-bit value at `index` in `map`.
     */
    function get(Uint32Map storage map, uint256 index) internal view returns (uint32) {
        uint256 bucket = index >> 3; // 8 values per bucket (256/32)
        uint256 shift = (index & 0x07) << 5; // i.e. (index % 8) * 32 = position * 32
        return uint32(map._data[bucket] >> shift);
    }

    /**
     * @dev Sets the 32-bit value at `index` in `map`.
     *
     * NOTE: Assumes `value` fits in 32 bits. Assembly-manipulated values may corrupt adjacent data.
     */
    function set(Uint32Map storage map, uint256 index, uint32 value) internal {
        uint256 bucket = index >> 3; // 8 values per bucket (256/32)
        uint256 shift = (index & 0x07) << 5; // i.e. (index % 8) * 32 = position * 32
        uint256 mask = 0xffffffff << shift;
        map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the 32 bits
    }

    struct Uint64Map {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the 64-bit value at `index` in `map`.
     */
    function get(Uint64Map storage map, uint256 index) internal view returns (uint64) {
        uint256 bucket = index >> 2; // 4 values per bucket (256/64)
        uint256 shift = (index & 0x03) << 6; // i.e. (index % 4) * 64 = position * 64
        return uint64(map._data[bucket] >> shift);
    }

    /**
     * @dev Sets the 64-bit value at `index` in `map`.
     *
     * NOTE: Assumes `value` fits in 64 bits. Assembly-manipulated values may corrupt adjacent data.
     */
    function set(Uint64Map storage map, uint256 index, uint64 value) internal {
        uint256 bucket = index >> 2; // 4 values per bucket (256/64)
        uint256 shift = (index & 0x03) << 6; // i.e. (index % 4) * 64 = position * 64
        uint256 mask = 0xffffffffffffffff << shift;
        map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the 64 bits
    }

    struct Uint128Map {
        mapping(uint256 bucket => uint256) _data;
    }

    /**
     * @dev Returns the 128-bit value at `index` in `map`.
     */
    function get(Uint128Map storage map, uint256 index) internal view returns (uint128) {
        uint256 bucket = index >> 1; // 2 values per bucket (256/128)
        uint256 shift = (index & 0x01) << 7; // i.e. (index % 2) * 128 = position * 128
        return uint128(map._data[bucket] >> shift);
    }

    /**
     * @dev Sets the 128-bit value at `index` in `map`.
     *
     * NOTE: Assumes `value` fits in 128 bits. Assembly-manipulated values may corrupt adjacent data.
     */
    function set(Uint128Map storage map, uint256 index, uint128 value) internal {
        uint256 bucket = index >> 1; // 2 values per bucket (256/128)
        uint256 shift = (index & 0x01) << 7; // i.e. (index % 2) * 128 = position * 128
        uint256 mask = 0xffffffffffffffffffffffffffffffff << shift;
        map._data[bucket] = (map._data[bucket] & ~mask) | (uint256(value) << shift); // set the 128 bits
    }
}
