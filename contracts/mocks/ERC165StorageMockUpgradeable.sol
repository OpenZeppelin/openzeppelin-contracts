// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/ERC165StorageUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC165StorageMockUpgradeable is Initializable, ERC165StorageUpgradeable {
    function __ERC165StorageMock_init() internal onlyInitializing {
    }

    function __ERC165StorageMock_init_unchained() internal onlyInitializing {
    }
    function registerInterface(bytes4 interfaceId) public {
        _registerInterface(interfaceId);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
