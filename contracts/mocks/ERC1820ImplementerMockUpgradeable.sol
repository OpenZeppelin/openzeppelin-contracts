// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/introspection/ERC1820ImplementerUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC1820ImplementerMockUpgradeable is Initializable, ERC1820ImplementerUpgradeable {
    function __ERC1820ImplementerMock_init() internal onlyInitializing {
        __ERC1820Implementer_init_unchained();
        __ERC1820ImplementerMock_init_unchained();
    }

    function __ERC1820ImplementerMock_init_unchained() internal onlyInitializing {
    }
    function registerInterfaceForAddress(bytes32 interfaceHash, address account) public {
        _registerInterfaceForAddress(interfaceHash, account);
    }
    uint256[50] private __gap;
}
