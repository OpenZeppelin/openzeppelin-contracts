// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../access/OwnableUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract OwnableMockUpgradeable is Initializable, OwnableUpgradeable {    function __OwnableMock_init() internal onlyInitializing {
        __Ownable_init_unchained();
    }

    function __OwnableMock_init_unchained() internal onlyInitializing {
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
