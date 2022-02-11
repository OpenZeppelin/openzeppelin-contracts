// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "../proxy/utils/Initializable.sol";

contract BadBeaconNoImplUpgradeable is Initializable {    function __BadBeaconNoImpl_init() internal onlyInitializing {
    }

    function __BadBeaconNoImpl_init_unchained() internal onlyInitializing {
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}

contract BadBeaconNotContractUpgradeable is Initializable {
    function __BadBeaconNotContract_init() internal onlyInitializing {
    }

    function __BadBeaconNotContract_init_unchained() internal onlyInitializing {
    }
    function implementation() external pure returns (address) {
        return address(0x1);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
