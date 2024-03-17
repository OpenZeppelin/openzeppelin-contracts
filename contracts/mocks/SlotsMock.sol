// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/SlotsMock.js.

pragma solidity ^0.8.24;

import {Multicall} from "../utils/Multicall.sol";
import {Slots} from "../utils/Slots.sol";

contract SlotsMock is Multicall {
    using Slots for *;

    event BoolSlotValue(bytes32 slot, bool value);

    function tloadBoolSlot(bytes32 slot) public {
        emit BoolSlotValue(slot, slot.asBoolSlot().tload());
    }

    function tstore(bytes32 slot, bool value) public {
        slot.asBoolSlot().tstore(value);
    }

    event AddressSlotValue(bytes32 slot, address value);

    function tloadAddressSlot(bytes32 slot) public {
        emit AddressSlotValue(slot, slot.asAddressSlot().tload());
    }

    function tstore(bytes32 slot, address value) public {
        slot.asAddressSlot().tstore(value);
    }

    event Bytes1SlotValue(bytes32 slot, bytes1 value);

    function tloadBytes1Slot(bytes32 slot) public {
        emit Bytes1SlotValue(slot, slot.asBytes1Slot().tload());
    }

    function tstore(bytes32 slot, bytes1 value) public {
        slot.asBytes1Slot().tstore(value);
    }

    event Bytes2SlotValue(bytes32 slot, bytes2 value);

    function tloadBytes2Slot(bytes32 slot) public {
        emit Bytes2SlotValue(slot, slot.asBytes2Slot().tload());
    }

    function tstore(bytes32 slot, bytes2 value) public {
        slot.asBytes2Slot().tstore(value);
    }

    event Bytes3SlotValue(bytes32 slot, bytes3 value);

    function tloadBytes3Slot(bytes32 slot) public {
        emit Bytes3SlotValue(slot, slot.asBytes3Slot().tload());
    }

    function tstore(bytes32 slot, bytes3 value) public {
        slot.asBytes3Slot().tstore(value);
    }

    event Bytes4SlotValue(bytes32 slot, bytes4 value);

    function tloadBytes4Slot(bytes32 slot) public {
        emit Bytes4SlotValue(slot, slot.asBytes4Slot().tload());
    }

    function tstore(bytes32 slot, bytes4 value) public {
        slot.asBytes4Slot().tstore(value);
    }

    event Bytes5SlotValue(bytes32 slot, bytes5 value);

    function tloadBytes5Slot(bytes32 slot) public {
        emit Bytes5SlotValue(slot, slot.asBytes5Slot().tload());
    }

    function tstore(bytes32 slot, bytes5 value) public {
        slot.asBytes5Slot().tstore(value);
    }

    event Bytes6SlotValue(bytes32 slot, bytes6 value);

    function tloadBytes6Slot(bytes32 slot) public {
        emit Bytes6SlotValue(slot, slot.asBytes6Slot().tload());
    }

    function tstore(bytes32 slot, bytes6 value) public {
        slot.asBytes6Slot().tstore(value);
    }

    event Bytes7SlotValue(bytes32 slot, bytes7 value);

    function tloadBytes7Slot(bytes32 slot) public {
        emit Bytes7SlotValue(slot, slot.asBytes7Slot().tload());
    }

    function tstore(bytes32 slot, bytes7 value) public {
        slot.asBytes7Slot().tstore(value);
    }

    event Bytes8SlotValue(bytes32 slot, bytes8 value);

    function tloadBytes8Slot(bytes32 slot) public {
        emit Bytes8SlotValue(slot, slot.asBytes8Slot().tload());
    }

    function tstore(bytes32 slot, bytes8 value) public {
        slot.asBytes8Slot().tstore(value);
    }

    event Bytes9SlotValue(bytes32 slot, bytes9 value);

    function tloadBytes9Slot(bytes32 slot) public {
        emit Bytes9SlotValue(slot, slot.asBytes9Slot().tload());
    }

    function tstore(bytes32 slot, bytes9 value) public {
        slot.asBytes9Slot().tstore(value);
    }

    event Bytes10SlotValue(bytes32 slot, bytes10 value);

    function tloadBytes10Slot(bytes32 slot) public {
        emit Bytes10SlotValue(slot, slot.asBytes10Slot().tload());
    }

    function tstore(bytes32 slot, bytes10 value) public {
        slot.asBytes10Slot().tstore(value);
    }

    event Bytes11SlotValue(bytes32 slot, bytes11 value);

    function tloadBytes11Slot(bytes32 slot) public {
        emit Bytes11SlotValue(slot, slot.asBytes11Slot().tload());
    }

    function tstore(bytes32 slot, bytes11 value) public {
        slot.asBytes11Slot().tstore(value);
    }

    event Bytes12SlotValue(bytes32 slot, bytes12 value);

    function tloadBytes12Slot(bytes32 slot) public {
        emit Bytes12SlotValue(slot, slot.asBytes12Slot().tload());
    }

    function tstore(bytes32 slot, bytes12 value) public {
        slot.asBytes12Slot().tstore(value);
    }

    event Bytes13SlotValue(bytes32 slot, bytes13 value);

    function tloadBytes13Slot(bytes32 slot) public {
        emit Bytes13SlotValue(slot, slot.asBytes13Slot().tload());
    }

    function tstore(bytes32 slot, bytes13 value) public {
        slot.asBytes13Slot().tstore(value);
    }

    event Bytes14SlotValue(bytes32 slot, bytes14 value);

    function tloadBytes14Slot(bytes32 slot) public {
        emit Bytes14SlotValue(slot, slot.asBytes14Slot().tload());
    }

    function tstore(bytes32 slot, bytes14 value) public {
        slot.asBytes14Slot().tstore(value);
    }

    event Bytes15SlotValue(bytes32 slot, bytes15 value);

    function tloadBytes15Slot(bytes32 slot) public {
        emit Bytes15SlotValue(slot, slot.asBytes15Slot().tload());
    }

    function tstore(bytes32 slot, bytes15 value) public {
        slot.asBytes15Slot().tstore(value);
    }

    event Bytes16SlotValue(bytes32 slot, bytes16 value);

    function tloadBytes16Slot(bytes32 slot) public {
        emit Bytes16SlotValue(slot, slot.asBytes16Slot().tload());
    }

    function tstore(bytes32 slot, bytes16 value) public {
        slot.asBytes16Slot().tstore(value);
    }

    event Bytes17SlotValue(bytes32 slot, bytes17 value);

    function tloadBytes17Slot(bytes32 slot) public {
        emit Bytes17SlotValue(slot, slot.asBytes17Slot().tload());
    }

    function tstore(bytes32 slot, bytes17 value) public {
        slot.asBytes17Slot().tstore(value);
    }

    event Bytes18SlotValue(bytes32 slot, bytes18 value);

    function tloadBytes18Slot(bytes32 slot) public {
        emit Bytes18SlotValue(slot, slot.asBytes18Slot().tload());
    }

    function tstore(bytes32 slot, bytes18 value) public {
        slot.asBytes18Slot().tstore(value);
    }

    event Bytes19SlotValue(bytes32 slot, bytes19 value);

    function tloadBytes19Slot(bytes32 slot) public {
        emit Bytes19SlotValue(slot, slot.asBytes19Slot().tload());
    }

    function tstore(bytes32 slot, bytes19 value) public {
        slot.asBytes19Slot().tstore(value);
    }

    event Bytes20SlotValue(bytes32 slot, bytes20 value);

    function tloadBytes20Slot(bytes32 slot) public {
        emit Bytes20SlotValue(slot, slot.asBytes20Slot().tload());
    }

    function tstore(bytes32 slot, bytes20 value) public {
        slot.asBytes20Slot().tstore(value);
    }

    event Bytes21SlotValue(bytes32 slot, bytes21 value);

    function tloadBytes21Slot(bytes32 slot) public {
        emit Bytes21SlotValue(slot, slot.asBytes21Slot().tload());
    }

    function tstore(bytes32 slot, bytes21 value) public {
        slot.asBytes21Slot().tstore(value);
    }

    event Bytes22SlotValue(bytes32 slot, bytes22 value);

    function tloadBytes22Slot(bytes32 slot) public {
        emit Bytes22SlotValue(slot, slot.asBytes22Slot().tload());
    }

    function tstore(bytes32 slot, bytes22 value) public {
        slot.asBytes22Slot().tstore(value);
    }

    event Bytes23SlotValue(bytes32 slot, bytes23 value);

    function tloadBytes23Slot(bytes32 slot) public {
        emit Bytes23SlotValue(slot, slot.asBytes23Slot().tload());
    }

    function tstore(bytes32 slot, bytes23 value) public {
        slot.asBytes23Slot().tstore(value);
    }

    event Bytes24SlotValue(bytes32 slot, bytes24 value);

    function tloadBytes24Slot(bytes32 slot) public {
        emit Bytes24SlotValue(slot, slot.asBytes24Slot().tload());
    }

    function tstore(bytes32 slot, bytes24 value) public {
        slot.asBytes24Slot().tstore(value);
    }

    event Bytes25SlotValue(bytes32 slot, bytes25 value);

    function tloadBytes25Slot(bytes32 slot) public {
        emit Bytes25SlotValue(slot, slot.asBytes25Slot().tload());
    }

    function tstore(bytes32 slot, bytes25 value) public {
        slot.asBytes25Slot().tstore(value);
    }

    event Bytes26SlotValue(bytes32 slot, bytes26 value);

    function tloadBytes26Slot(bytes32 slot) public {
        emit Bytes26SlotValue(slot, slot.asBytes26Slot().tload());
    }

    function tstore(bytes32 slot, bytes26 value) public {
        slot.asBytes26Slot().tstore(value);
    }

    event Bytes27SlotValue(bytes32 slot, bytes27 value);

    function tloadBytes27Slot(bytes32 slot) public {
        emit Bytes27SlotValue(slot, slot.asBytes27Slot().tload());
    }

    function tstore(bytes32 slot, bytes27 value) public {
        slot.asBytes27Slot().tstore(value);
    }

    event Bytes28SlotValue(bytes32 slot, bytes28 value);

    function tloadBytes28Slot(bytes32 slot) public {
        emit Bytes28SlotValue(slot, slot.asBytes28Slot().tload());
    }

    function tstore(bytes32 slot, bytes28 value) public {
        slot.asBytes28Slot().tstore(value);
    }

    event Bytes29SlotValue(bytes32 slot, bytes29 value);

    function tloadBytes29Slot(bytes32 slot) public {
        emit Bytes29SlotValue(slot, slot.asBytes29Slot().tload());
    }

    function tstore(bytes32 slot, bytes29 value) public {
        slot.asBytes29Slot().tstore(value);
    }

    event Bytes30SlotValue(bytes32 slot, bytes30 value);

    function tloadBytes30Slot(bytes32 slot) public {
        emit Bytes30SlotValue(slot, slot.asBytes30Slot().tload());
    }

    function tstore(bytes32 slot, bytes30 value) public {
        slot.asBytes30Slot().tstore(value);
    }

    event Bytes31SlotValue(bytes32 slot, bytes31 value);

    function tloadBytes31Slot(bytes32 slot) public {
        emit Bytes31SlotValue(slot, slot.asBytes31Slot().tload());
    }

    function tstore(bytes32 slot, bytes31 value) public {
        slot.asBytes31Slot().tstore(value);
    }

    event Bytes32SlotValue(bytes32 slot, bytes32 value);

    function tloadBytes32Slot(bytes32 slot) public {
        emit Bytes32SlotValue(slot, slot.asBytes32Slot().tload());
    }

    function tstore(bytes32 slot, bytes32 value) public {
        slot.asBytes32Slot().tstore(value);
    }

    event Uint8SlotValue(bytes32 slot, uint8 value);

    function tloadUint8Slot(bytes32 slot) public {
        emit Uint8SlotValue(slot, slot.asUint8Slot().tload());
    }

    function tstore(bytes32 slot, uint8 value) public {
        slot.asUint8Slot().tstore(value);
    }

    event Uint16SlotValue(bytes32 slot, uint16 value);

    function tloadUint16Slot(bytes32 slot) public {
        emit Uint16SlotValue(slot, slot.asUint16Slot().tload());
    }

    function tstore(bytes32 slot, uint16 value) public {
        slot.asUint16Slot().tstore(value);
    }

    event Uint24SlotValue(bytes32 slot, uint24 value);

    function tloadUint24Slot(bytes32 slot) public {
        emit Uint24SlotValue(slot, slot.asUint24Slot().tload());
    }

    function tstore(bytes32 slot, uint24 value) public {
        slot.asUint24Slot().tstore(value);
    }

    event Uint32SlotValue(bytes32 slot, uint32 value);

    function tloadUint32Slot(bytes32 slot) public {
        emit Uint32SlotValue(slot, slot.asUint32Slot().tload());
    }

    function tstore(bytes32 slot, uint32 value) public {
        slot.asUint32Slot().tstore(value);
    }

    event Uint40SlotValue(bytes32 slot, uint40 value);

    function tloadUint40Slot(bytes32 slot) public {
        emit Uint40SlotValue(slot, slot.asUint40Slot().tload());
    }

    function tstore(bytes32 slot, uint40 value) public {
        slot.asUint40Slot().tstore(value);
    }

    event Uint48SlotValue(bytes32 slot, uint48 value);

    function tloadUint48Slot(bytes32 slot) public {
        emit Uint48SlotValue(slot, slot.asUint48Slot().tload());
    }

    function tstore(bytes32 slot, uint48 value) public {
        slot.asUint48Slot().tstore(value);
    }

    event Uint56SlotValue(bytes32 slot, uint56 value);

    function tloadUint56Slot(bytes32 slot) public {
        emit Uint56SlotValue(slot, slot.asUint56Slot().tload());
    }

    function tstore(bytes32 slot, uint56 value) public {
        slot.asUint56Slot().tstore(value);
    }

    event Uint64SlotValue(bytes32 slot, uint64 value);

    function tloadUint64Slot(bytes32 slot) public {
        emit Uint64SlotValue(slot, slot.asUint64Slot().tload());
    }

    function tstore(bytes32 slot, uint64 value) public {
        slot.asUint64Slot().tstore(value);
    }

    event Uint72SlotValue(bytes32 slot, uint72 value);

    function tloadUint72Slot(bytes32 slot) public {
        emit Uint72SlotValue(slot, slot.asUint72Slot().tload());
    }

    function tstore(bytes32 slot, uint72 value) public {
        slot.asUint72Slot().tstore(value);
    }

    event Uint80SlotValue(bytes32 slot, uint80 value);

    function tloadUint80Slot(bytes32 slot) public {
        emit Uint80SlotValue(slot, slot.asUint80Slot().tload());
    }

    function tstore(bytes32 slot, uint80 value) public {
        slot.asUint80Slot().tstore(value);
    }

    event Uint88SlotValue(bytes32 slot, uint88 value);

    function tloadUint88Slot(bytes32 slot) public {
        emit Uint88SlotValue(slot, slot.asUint88Slot().tload());
    }

    function tstore(bytes32 slot, uint88 value) public {
        slot.asUint88Slot().tstore(value);
    }

    event Uint96SlotValue(bytes32 slot, uint96 value);

    function tloadUint96Slot(bytes32 slot) public {
        emit Uint96SlotValue(slot, slot.asUint96Slot().tload());
    }

    function tstore(bytes32 slot, uint96 value) public {
        slot.asUint96Slot().tstore(value);
    }

    event Uint104SlotValue(bytes32 slot, uint104 value);

    function tloadUint104Slot(bytes32 slot) public {
        emit Uint104SlotValue(slot, slot.asUint104Slot().tload());
    }

    function tstore(bytes32 slot, uint104 value) public {
        slot.asUint104Slot().tstore(value);
    }

    event Uint112SlotValue(bytes32 slot, uint112 value);

    function tloadUint112Slot(bytes32 slot) public {
        emit Uint112SlotValue(slot, slot.asUint112Slot().tload());
    }

    function tstore(bytes32 slot, uint112 value) public {
        slot.asUint112Slot().tstore(value);
    }

    event Uint120SlotValue(bytes32 slot, uint120 value);

    function tloadUint120Slot(bytes32 slot) public {
        emit Uint120SlotValue(slot, slot.asUint120Slot().tload());
    }

    function tstore(bytes32 slot, uint120 value) public {
        slot.asUint120Slot().tstore(value);
    }

    event Uint128SlotValue(bytes32 slot, uint128 value);

    function tloadUint128Slot(bytes32 slot) public {
        emit Uint128SlotValue(slot, slot.asUint128Slot().tload());
    }

    function tstore(bytes32 slot, uint128 value) public {
        slot.asUint128Slot().tstore(value);
    }

    event Uint136SlotValue(bytes32 slot, uint136 value);

    function tloadUint136Slot(bytes32 slot) public {
        emit Uint136SlotValue(slot, slot.asUint136Slot().tload());
    }

    function tstore(bytes32 slot, uint136 value) public {
        slot.asUint136Slot().tstore(value);
    }

    event Uint144SlotValue(bytes32 slot, uint144 value);

    function tloadUint144Slot(bytes32 slot) public {
        emit Uint144SlotValue(slot, slot.asUint144Slot().tload());
    }

    function tstore(bytes32 slot, uint144 value) public {
        slot.asUint144Slot().tstore(value);
    }

    event Uint152SlotValue(bytes32 slot, uint152 value);

    function tloadUint152Slot(bytes32 slot) public {
        emit Uint152SlotValue(slot, slot.asUint152Slot().tload());
    }

    function tstore(bytes32 slot, uint152 value) public {
        slot.asUint152Slot().tstore(value);
    }

    event Uint160SlotValue(bytes32 slot, uint160 value);

    function tloadUint160Slot(bytes32 slot) public {
        emit Uint160SlotValue(slot, slot.asUint160Slot().tload());
    }

    function tstore(bytes32 slot, uint160 value) public {
        slot.asUint160Slot().tstore(value);
    }

    event Uint168SlotValue(bytes32 slot, uint168 value);

    function tloadUint168Slot(bytes32 slot) public {
        emit Uint168SlotValue(slot, slot.asUint168Slot().tload());
    }

    function tstore(bytes32 slot, uint168 value) public {
        slot.asUint168Slot().tstore(value);
    }

    event Uint176SlotValue(bytes32 slot, uint176 value);

    function tloadUint176Slot(bytes32 slot) public {
        emit Uint176SlotValue(slot, slot.asUint176Slot().tload());
    }

    function tstore(bytes32 slot, uint176 value) public {
        slot.asUint176Slot().tstore(value);
    }

    event Uint184SlotValue(bytes32 slot, uint184 value);

    function tloadUint184Slot(bytes32 slot) public {
        emit Uint184SlotValue(slot, slot.asUint184Slot().tload());
    }

    function tstore(bytes32 slot, uint184 value) public {
        slot.asUint184Slot().tstore(value);
    }

    event Uint192SlotValue(bytes32 slot, uint192 value);

    function tloadUint192Slot(bytes32 slot) public {
        emit Uint192SlotValue(slot, slot.asUint192Slot().tload());
    }

    function tstore(bytes32 slot, uint192 value) public {
        slot.asUint192Slot().tstore(value);
    }

    event Uint200SlotValue(bytes32 slot, uint200 value);

    function tloadUint200Slot(bytes32 slot) public {
        emit Uint200SlotValue(slot, slot.asUint200Slot().tload());
    }

    function tstore(bytes32 slot, uint200 value) public {
        slot.asUint200Slot().tstore(value);
    }

    event Uint208SlotValue(bytes32 slot, uint208 value);

    function tloadUint208Slot(bytes32 slot) public {
        emit Uint208SlotValue(slot, slot.asUint208Slot().tload());
    }

    function tstore(bytes32 slot, uint208 value) public {
        slot.asUint208Slot().tstore(value);
    }

    event Uint216SlotValue(bytes32 slot, uint216 value);

    function tloadUint216Slot(bytes32 slot) public {
        emit Uint216SlotValue(slot, slot.asUint216Slot().tload());
    }

    function tstore(bytes32 slot, uint216 value) public {
        slot.asUint216Slot().tstore(value);
    }

    event Uint224SlotValue(bytes32 slot, uint224 value);

    function tloadUint224Slot(bytes32 slot) public {
        emit Uint224SlotValue(slot, slot.asUint224Slot().tload());
    }

    function tstore(bytes32 slot, uint224 value) public {
        slot.asUint224Slot().tstore(value);
    }

    event Uint232SlotValue(bytes32 slot, uint232 value);

    function tloadUint232Slot(bytes32 slot) public {
        emit Uint232SlotValue(slot, slot.asUint232Slot().tload());
    }

    function tstore(bytes32 slot, uint232 value) public {
        slot.asUint232Slot().tstore(value);
    }

    event Uint240SlotValue(bytes32 slot, uint240 value);

    function tloadUint240Slot(bytes32 slot) public {
        emit Uint240SlotValue(slot, slot.asUint240Slot().tload());
    }

    function tstore(bytes32 slot, uint240 value) public {
        slot.asUint240Slot().tstore(value);
    }

    event Uint248SlotValue(bytes32 slot, uint248 value);

    function tloadUint248Slot(bytes32 slot) public {
        emit Uint248SlotValue(slot, slot.asUint248Slot().tload());
    }

    function tstore(bytes32 slot, uint248 value) public {
        slot.asUint248Slot().tstore(value);
    }

    event Uint256SlotValue(bytes32 slot, uint256 value);

    function tloadUint256Slot(bytes32 slot) public {
        emit Uint256SlotValue(slot, slot.asUint256Slot().tload());
    }

    function tstore(bytes32 slot, uint256 value) public {
        slot.asUint256Slot().tstore(value);
    }

    event Int8SlotValue(bytes32 slot, int8 value);

    function tloadInt8Slot(bytes32 slot) public {
        emit Int8SlotValue(slot, slot.asInt8Slot().tload());
    }

    function tstore(bytes32 slot, int8 value) public {
        slot.asInt8Slot().tstore(value);
    }

    event Int16SlotValue(bytes32 slot, int16 value);

    function tloadInt16Slot(bytes32 slot) public {
        emit Int16SlotValue(slot, slot.asInt16Slot().tload());
    }

    function tstore(bytes32 slot, int16 value) public {
        slot.asInt16Slot().tstore(value);
    }

    event Int24SlotValue(bytes32 slot, int24 value);

    function tloadInt24Slot(bytes32 slot) public {
        emit Int24SlotValue(slot, slot.asInt24Slot().tload());
    }

    function tstore(bytes32 slot, int24 value) public {
        slot.asInt24Slot().tstore(value);
    }

    event Int32SlotValue(bytes32 slot, int32 value);

    function tloadInt32Slot(bytes32 slot) public {
        emit Int32SlotValue(slot, slot.asInt32Slot().tload());
    }

    function tstore(bytes32 slot, int32 value) public {
        slot.asInt32Slot().tstore(value);
    }

    event Int40SlotValue(bytes32 slot, int40 value);

    function tloadInt40Slot(bytes32 slot) public {
        emit Int40SlotValue(slot, slot.asInt40Slot().tload());
    }

    function tstore(bytes32 slot, int40 value) public {
        slot.asInt40Slot().tstore(value);
    }

    event Int48SlotValue(bytes32 slot, int48 value);

    function tloadInt48Slot(bytes32 slot) public {
        emit Int48SlotValue(slot, slot.asInt48Slot().tload());
    }

    function tstore(bytes32 slot, int48 value) public {
        slot.asInt48Slot().tstore(value);
    }

    event Int56SlotValue(bytes32 slot, int56 value);

    function tloadInt56Slot(bytes32 slot) public {
        emit Int56SlotValue(slot, slot.asInt56Slot().tload());
    }

    function tstore(bytes32 slot, int56 value) public {
        slot.asInt56Slot().tstore(value);
    }

    event Int64SlotValue(bytes32 slot, int64 value);

    function tloadInt64Slot(bytes32 slot) public {
        emit Int64SlotValue(slot, slot.asInt64Slot().tload());
    }

    function tstore(bytes32 slot, int64 value) public {
        slot.asInt64Slot().tstore(value);
    }

    event Int72SlotValue(bytes32 slot, int72 value);

    function tloadInt72Slot(bytes32 slot) public {
        emit Int72SlotValue(slot, slot.asInt72Slot().tload());
    }

    function tstore(bytes32 slot, int72 value) public {
        slot.asInt72Slot().tstore(value);
    }

    event Int80SlotValue(bytes32 slot, int80 value);

    function tloadInt80Slot(bytes32 slot) public {
        emit Int80SlotValue(slot, slot.asInt80Slot().tload());
    }

    function tstore(bytes32 slot, int80 value) public {
        slot.asInt80Slot().tstore(value);
    }

    event Int88SlotValue(bytes32 slot, int88 value);

    function tloadInt88Slot(bytes32 slot) public {
        emit Int88SlotValue(slot, slot.asInt88Slot().tload());
    }

    function tstore(bytes32 slot, int88 value) public {
        slot.asInt88Slot().tstore(value);
    }

    event Int96SlotValue(bytes32 slot, int96 value);

    function tloadInt96Slot(bytes32 slot) public {
        emit Int96SlotValue(slot, slot.asInt96Slot().tload());
    }

    function tstore(bytes32 slot, int96 value) public {
        slot.asInt96Slot().tstore(value);
    }

    event Int104SlotValue(bytes32 slot, int104 value);

    function tloadInt104Slot(bytes32 slot) public {
        emit Int104SlotValue(slot, slot.asInt104Slot().tload());
    }

    function tstore(bytes32 slot, int104 value) public {
        slot.asInt104Slot().tstore(value);
    }

    event Int112SlotValue(bytes32 slot, int112 value);

    function tloadInt112Slot(bytes32 slot) public {
        emit Int112SlotValue(slot, slot.asInt112Slot().tload());
    }

    function tstore(bytes32 slot, int112 value) public {
        slot.asInt112Slot().tstore(value);
    }

    event Int120SlotValue(bytes32 slot, int120 value);

    function tloadInt120Slot(bytes32 slot) public {
        emit Int120SlotValue(slot, slot.asInt120Slot().tload());
    }

    function tstore(bytes32 slot, int120 value) public {
        slot.asInt120Slot().tstore(value);
    }

    event Int128SlotValue(bytes32 slot, int128 value);

    function tloadInt128Slot(bytes32 slot) public {
        emit Int128SlotValue(slot, slot.asInt128Slot().tload());
    }

    function tstore(bytes32 slot, int128 value) public {
        slot.asInt128Slot().tstore(value);
    }

    event Int136SlotValue(bytes32 slot, int136 value);

    function tloadInt136Slot(bytes32 slot) public {
        emit Int136SlotValue(slot, slot.asInt136Slot().tload());
    }

    function tstore(bytes32 slot, int136 value) public {
        slot.asInt136Slot().tstore(value);
    }

    event Int144SlotValue(bytes32 slot, int144 value);

    function tloadInt144Slot(bytes32 slot) public {
        emit Int144SlotValue(slot, slot.asInt144Slot().tload());
    }

    function tstore(bytes32 slot, int144 value) public {
        slot.asInt144Slot().tstore(value);
    }

    event Int152SlotValue(bytes32 slot, int152 value);

    function tloadInt152Slot(bytes32 slot) public {
        emit Int152SlotValue(slot, slot.asInt152Slot().tload());
    }

    function tstore(bytes32 slot, int152 value) public {
        slot.asInt152Slot().tstore(value);
    }

    event Int160SlotValue(bytes32 slot, int160 value);

    function tloadInt160Slot(bytes32 slot) public {
        emit Int160SlotValue(slot, slot.asInt160Slot().tload());
    }

    function tstore(bytes32 slot, int160 value) public {
        slot.asInt160Slot().tstore(value);
    }

    event Int168SlotValue(bytes32 slot, int168 value);

    function tloadInt168Slot(bytes32 slot) public {
        emit Int168SlotValue(slot, slot.asInt168Slot().tload());
    }

    function tstore(bytes32 slot, int168 value) public {
        slot.asInt168Slot().tstore(value);
    }

    event Int176SlotValue(bytes32 slot, int176 value);

    function tloadInt176Slot(bytes32 slot) public {
        emit Int176SlotValue(slot, slot.asInt176Slot().tload());
    }

    function tstore(bytes32 slot, int176 value) public {
        slot.asInt176Slot().tstore(value);
    }

    event Int184SlotValue(bytes32 slot, int184 value);

    function tloadInt184Slot(bytes32 slot) public {
        emit Int184SlotValue(slot, slot.asInt184Slot().tload());
    }

    function tstore(bytes32 slot, int184 value) public {
        slot.asInt184Slot().tstore(value);
    }

    event Int192SlotValue(bytes32 slot, int192 value);

    function tloadInt192Slot(bytes32 slot) public {
        emit Int192SlotValue(slot, slot.asInt192Slot().tload());
    }

    function tstore(bytes32 slot, int192 value) public {
        slot.asInt192Slot().tstore(value);
    }

    event Int200SlotValue(bytes32 slot, int200 value);

    function tloadInt200Slot(bytes32 slot) public {
        emit Int200SlotValue(slot, slot.asInt200Slot().tload());
    }

    function tstore(bytes32 slot, int200 value) public {
        slot.asInt200Slot().tstore(value);
    }

    event Int208SlotValue(bytes32 slot, int208 value);

    function tloadInt208Slot(bytes32 slot) public {
        emit Int208SlotValue(slot, slot.asInt208Slot().tload());
    }

    function tstore(bytes32 slot, int208 value) public {
        slot.asInt208Slot().tstore(value);
    }

    event Int216SlotValue(bytes32 slot, int216 value);

    function tloadInt216Slot(bytes32 slot) public {
        emit Int216SlotValue(slot, slot.asInt216Slot().tload());
    }

    function tstore(bytes32 slot, int216 value) public {
        slot.asInt216Slot().tstore(value);
    }

    event Int224SlotValue(bytes32 slot, int224 value);

    function tloadInt224Slot(bytes32 slot) public {
        emit Int224SlotValue(slot, slot.asInt224Slot().tload());
    }

    function tstore(bytes32 slot, int224 value) public {
        slot.asInt224Slot().tstore(value);
    }

    event Int232SlotValue(bytes32 slot, int232 value);

    function tloadInt232Slot(bytes32 slot) public {
        emit Int232SlotValue(slot, slot.asInt232Slot().tload());
    }

    function tstore(bytes32 slot, int232 value) public {
        slot.asInt232Slot().tstore(value);
    }

    event Int240SlotValue(bytes32 slot, int240 value);

    function tloadInt240Slot(bytes32 slot) public {
        emit Int240SlotValue(slot, slot.asInt240Slot().tload());
    }

    function tstore(bytes32 slot, int240 value) public {
        slot.asInt240Slot().tstore(value);
    }

    event Int248SlotValue(bytes32 slot, int248 value);

    function tloadInt248Slot(bytes32 slot) public {
        emit Int248SlotValue(slot, slot.asInt248Slot().tload());
    }

    function tstore(bytes32 slot, int248 value) public {
        slot.asInt248Slot().tstore(value);
    }

    event Int256SlotValue(bytes32 slot, int256 value);

    function tloadInt256Slot(bytes32 slot) public {
        emit Int256SlotValue(slot, slot.asInt256Slot().tload());
    }

    function tstore(bytes32 slot, int256 value) public {
        slot.asInt256Slot().tstore(value);
    }
}
