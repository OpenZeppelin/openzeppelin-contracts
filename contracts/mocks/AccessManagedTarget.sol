// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccessManaged} from "../access/manager/AccessManaged.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";

abstract contract AccessManagedTarget is AccessManaged {
    event CalledRestricted(address caller);
    event CalledUnrestricted(address caller);
    event CalledFallback(address caller);

    function fnRestricted() public restricted {
        emit CalledRestricted(msg.sender);
    }

    function fnUnrestricted() public {
        emit CalledUnrestricted(msg.sender);
    }

    function setIsConsumingScheduledOp(bool isConsuming) external {
        // Memory layout is 0x....<_consumingSchedule (boolean)><authority (address)>
        bytes32 mask = bytes32(uint256(1 << 160));
        if (isConsuming) {
            _consumingSchedule().value |= mask;
        } else {
            _consumingSchedule().value &= ~mask;
        }
    }

    function _consumingSchedule() internal pure returns (StorageSlot.Bytes32Slot storage) {
        return StorageSlot.getBytes32Slot(bytes32(uint256(0)));
    }

    fallback() external {
        emit CalledFallback(msg.sender);
    }
}
