// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccessManaged} from "../access/manager/AccessManaged.sol";
import {IAccessManager} from "../access/manager/IAccessManager.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";

abstract contract AccessManagedTarget is AccessManaged {
    event CalledRestricted(address caller);
    event CalledUnrestricted(address caller);
    event CalledFallback(address caller);
    event StillExecuting(bool immediate);

    function fnRestricted() public restricted {
        emit CalledRestricted(msg.sender);
    }

    /// @dev Performs a nested {IAccessManager-execute}, then reports whether this call is still marked as executing.
    function fnRestrictedNested(address target, bytes calldata data) public restricted {
        IAccessManager(authority()).execute(target, data);
        // The nested call overwrote the execution identifier; it must have been restored before returning here.
        (bool immediate, ) = IAccessManager(authority()).canCall(authority(), address(this), msg.sig);
        emit StillExecuting(immediate);
    }

    function fnUnrestricted() public {
        emit CalledUnrestricted(msg.sender);
    }

    function setIsConsumingScheduledOp(bool isConsuming, bytes32 slot) external {
        // Memory layout is 0x....<_consumingSchedule (boolean)><authority (address)>
        bytes32 mask = bytes32(uint256(1 << 160));
        if (isConsuming) {
            StorageSlot.getBytes32Slot(slot).value |= mask;
        } else {
            StorageSlot.getBytes32Slot(slot).value &= ~mask;
        }
    }

    fallback() external {
        emit CalledFallback(msg.sender);
    }
}
