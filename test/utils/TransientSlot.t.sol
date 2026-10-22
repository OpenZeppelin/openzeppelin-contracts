// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {TransientSlot} from "@openzeppelin/contracts/utils/TransientSlot.sol";

contract TransientSlotCollision {
    using TransientSlot for *;

    // Both occupy slot 0 of their respective layouts (transient and persistent).
    uint256 private transient _native;
    TransientSlot.TUint256 private _reserved;

    function storeAndLoad(uint256 nativeValue, uint256 reservedValue) public returns (uint256, uint256) {
        _native = nativeValue;
        _reserved.tstore(reservedValue);
        return (_native, _reserved.tload());
    }
}

contract TransientSlotTest is Test {
    function testReservedSlotDoesNotCollideWithNativeTransient(uint256 nativeValue, uint256 reservedValue) public {
        (uint256 native, uint256 reserved) = new TransientSlotCollision().storeAndLoad(nativeValue, reservedValue);
        assertEq(native, nativeValue);
        assertEq(reserved, reservedValue);
    }
}
