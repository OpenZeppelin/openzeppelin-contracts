// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/ERC165Upgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC165MockUpgradeable is Initializable, ERC165Upgradeable {    function __ERC165Mock_init() internal onlyInitializing {
    }

    function __ERC165Mock_init_unchained() internal onlyInitializing {
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
