// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @dev Extension of {ReentrancyGuard} that adds the `__ReentrancyGuard_init` 
 * and `__ReentrancyGuard_init_unchained` functions for backward compatibility 
 * with upgradeable contracts that were already using it.
 */
abstract contract ReentrancyGuardUpgradeable is Initializable, ReentrancyGuard {
    function __ReentrancyGuard_init() internal onlyInitializing {
        __ReentrancyGuard_init_unchained();
    }

    function __ReentrancyGuard_init_unchained() internal onlyInitializing {
        // Storage slot: keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
        bytes32 slot = 0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;
        assembly {
            sstore(slot, 1)
        }
    }
}
