// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {StorageSlot} from "@openzeppelin/contracts/utils/StorageSlot.sol";

/**
 * @dev Extension of {ReentrancyGuard} that adds the `__ReentrancyGuard_init`
 * and `__ReentrancyGuard_init_unchained` functions for backward compatibility
 * with upgradeable contracts that were already using it.
 */
abstract contract ReentrancyGuardUpgradeable is Initializable, ReentrancyGuard {
    using StorageSlot for bytes32;

    function __ReentrancyGuard_init() internal onlyInitializing {
        __ReentrancyGuard_init_unchained();
    }

    function __ReentrancyGuard_init_unchained() internal onlyInitializing {
        // Use the base contract's accessor to avoid hardcoded slot duplication
        _reentrancyGuardStorageSlot().getUint256Slot().value = 1;
    }
}
