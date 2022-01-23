// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../utils/SafeCast.sol";

contract SafeCastMock {
    using SafeCast for uint;
    using SafeCast for int;

    function toUint256(int a) public pure returns (uint256) {
        return a.toUint256();
    }

    function toInt256(uint a) public pure returns (int256) {
        return a.toInt256();
    }

    function toUint128(uint a) public pure returns (uint128) {
        return a.toUint128();
    }

    function toUint64(uint a) public pure returns (uint64) {
        return a.toUint64();
    }

    function toUint32(uint a) public pure returns (uint32) {
        return a.toUint32();
    }

    function toUint16(uint a) public pure returns (uint16) {
        return a.toUint16();
    }

    function toUint8(uint a) public pure returns (uint8) {
        return a.toUint8();
    }

    function toInt128(int a) public pure returns (int128) {
        return a.toInt128();
    }

    function toInt64(int a) public pure returns (int64) {
        return a.toInt64();
    }

    function toInt32(int a) public pure returns (int32) {
        return a.toInt32();
    }

    function toInt16(int a) public pure returns (int16) {
        return a.toInt16();
    }

    function toInt8(int a) public pure returns (int8) {
        return a.toInt8();
    }
}
