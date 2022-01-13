// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/ERC165StorageUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC165StorageMockUpgradeable is Initializable, ERC165StorageUpgradeable {
    function __ERC165StorageMock_init() internal onlyInitializing {
        __ERC165_init_unchained();
        __ERC165Storage_init_unchained();
        __ERC165StorageMock_init_unchained();
    }

    function __ERC165StorageMock_init_unchained() internal onlyInitializing {
    }
    function registerInterface(bytes4 interfaceId) public {
        _registerInterface(interfaceId);
    }
    uint256[50] private __gap;
}
