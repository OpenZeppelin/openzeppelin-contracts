// SPDX-License-Identifier: MIT
// This file was procedurally generated from scripts/generate/templates/TransientSlotMock.sol.eta.

pragma solidity ^0.8.24;

import {Multicall} from "../utils/Multicall.sol";
import {TransientSlot} from "../utils/TransientSlot.sol";

contract TransientSlotMock is Multicall {
    using TransientSlot for *;

    // Reserved slots. These are the only state variables of this contract, so they cover the entirety of its
    // persistent storage layout, which `tstore` must leave untouched.
    TransientSlot.TAddress private _reservedAddress;
    TransientSlot.TBoolean private _reservedBoolean;
    TransientSlot.TBytes32 private _reservedBytes32;
    TransientSlot.TUint256 private _reservedUint256;
    TransientSlot.TInt256 private _reservedInt256;

    event AddressValue(bytes32 slot, address value);

    function tloadAddress(bytes32 slot) public {
        emit AddressValue(slot, slot.asAddress().tload());
    }

    function tstore(bytes32 slot, address value) public {
        slot.asAddress().tstore(value);
    }

    event ReservedAddressValue(address value);

    function tloadReservedAddress() public {
        emit ReservedAddressValue(_reservedAddress.tload());
    }

    function tstoreReserved(address value) public {
        _reservedAddress.tstore(value);
    }

    event BooleanValue(bytes32 slot, bool value);

    function tloadBoolean(bytes32 slot) public {
        emit BooleanValue(slot, slot.asBoolean().tload());
    }

    function tstore(bytes32 slot, bool value) public {
        slot.asBoolean().tstore(value);
    }

    event ReservedBooleanValue(bool value);

    function tloadReservedBoolean() public {
        emit ReservedBooleanValue(_reservedBoolean.tload());
    }

    function tstoreReserved(bool value) public {
        _reservedBoolean.tstore(value);
    }

    event Bytes32Value(bytes32 slot, bytes32 value);

    function tloadBytes32(bytes32 slot) public {
        emit Bytes32Value(slot, slot.asBytes32().tload());
    }

    function tstore(bytes32 slot, bytes32 value) public {
        slot.asBytes32().tstore(value);
    }

    event ReservedBytes32Value(bytes32 value);

    function tloadReservedBytes32() public {
        emit ReservedBytes32Value(_reservedBytes32.tload());
    }

    function tstoreReserved(bytes32 value) public {
        _reservedBytes32.tstore(value);
    }

    event Uint256Value(bytes32 slot, uint256 value);

    function tloadUint256(bytes32 slot) public {
        emit Uint256Value(slot, slot.asUint256().tload());
    }

    function tstore(bytes32 slot, uint256 value) public {
        slot.asUint256().tstore(value);
    }

    event ReservedUint256Value(uint256 value);

    function tloadReservedUint256() public {
        emit ReservedUint256Value(_reservedUint256.tload());
    }

    function tstoreReserved(uint256 value) public {
        _reservedUint256.tstore(value);
    }

    event Int256Value(bytes32 slot, int256 value);

    function tloadInt256(bytes32 slot) public {
        emit Int256Value(slot, slot.asInt256().tload());
    }

    function tstore(bytes32 slot, int256 value) public {
        slot.asInt256().tstore(value);
    }

    event ReservedInt256Value(int256 value);

    function tloadReservedInt256() public {
        emit ReservedInt256Value(_reservedInt256.tload());
    }

    function tstoreReserved(int256 value) public {
        _reservedInt256.tstore(value);
    }
}
