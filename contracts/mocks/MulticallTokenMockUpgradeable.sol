// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/MulticallUpgradeable.sol";
import "./ERC20MockUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract MulticallTokenMockUpgradeable is Initializable, ERC20MockUpgradeable, MulticallUpgradeable {
    function __MulticallTokenMock_init(uint256 initialBalance) internal onlyInitializing {
        __ERC20_init_unchained("MulticallToken", "BCT");
        __ERC20Mock_init_unchained("MulticallToken", "BCT", msg.sender, initialBalance);
    }

    function __MulticallTokenMock_init_unchained(uint256) internal onlyInitializing {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
