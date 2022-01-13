// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "../proxy/utils/Initializable.sol";

/**
 * @dev Implementation contract with an admin() function made to clash with
 * @dev TransparentUpgradeableProxy's to test correct functioning of the
 * @dev Transparent Proxy feature.
 */
contract ClashingImplementationUpgradeable is Initializable {
    function __ClashingImplementation_init() internal onlyInitializing {
        __ClashingImplementation_init_unchained();
    }

    function __ClashingImplementation_init_unchained() internal onlyInitializing {
    }
    function admin() external pure returns (address) {
        return 0x0000000000000000000000000000000011111142;
    }

    function delegatedFunction() external pure returns (bool) {
        return true;
    }
    uint256[50] private __gap;
}
