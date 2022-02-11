// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/ERC1820ImplementerUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC1820ImplementerMockUpgradeable is Initializable, ERC1820ImplementerUpgradeable {
    function __ERC1820ImplementerMock_init() internal onlyInitializing {
    }

    function __ERC1820ImplementerMock_init_unchained() internal onlyInitializing {
    }
    function registerInterfaceForAddress(bytes32 interfaceHash, address account) public {
        _registerInterfaceForAddress(interfaceHash, account);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
