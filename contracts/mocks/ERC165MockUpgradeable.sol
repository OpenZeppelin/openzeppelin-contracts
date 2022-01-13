// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/ERC165Upgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC165MockUpgradeable is Initializable, ERC165Upgradeable {    function __ERC165Mock_init() internal onlyInitializing {
        __ERC165_init_unchained();
        __ERC165Mock_init_unchained();
    }

    function __ERC165Mock_init_unchained() internal onlyInitializing {
    }
    uint256[50] private __gap;
}
