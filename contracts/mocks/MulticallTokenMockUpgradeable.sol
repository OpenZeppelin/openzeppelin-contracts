// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/MulticallUpgradeable.sol";
import "./ERC20MockUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract MulticallTokenMockUpgradeable is Initializable, ERC20MockUpgradeable, MulticallUpgradeable {
    function __MulticallTokenMock_init(uint256 initialBalance) internal onlyInitializing {
        __Context_init_unchained();
        __ERC20_init_unchained("MulticallToken", "BCT");
        __ERC20Mock_init_unchained("MulticallToken", "BCT", msg.sender, initialBalance);
        __Multicall_init_unchained();
        __MulticallTokenMock_init_unchained(initialBalance);
    }

    function __MulticallTokenMock_init_unchained(uint256) internal onlyInitializing {}
    uint256[50] private __gap;
}
