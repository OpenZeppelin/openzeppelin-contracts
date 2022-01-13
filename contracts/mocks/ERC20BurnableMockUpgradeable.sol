// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC20BurnableMockUpgradeable is Initializable, ERC20BurnableUpgradeable {
    function __ERC20BurnableMock_init(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) internal onlyInitializing {
        __Context_init_unchained();
        __ERC20_init_unchained(name, symbol);
        __ERC20Burnable_init_unchained();
        __ERC20BurnableMock_init_unchained(name, symbol, initialAccount, initialBalance);
    }

    function __ERC20BurnableMock_init_unchained(
        string memory,
        string memory,
        address initialAccount,
        uint256 initialBalance
    ) internal onlyInitializing {
        _mint(initialAccount, initialBalance);
    }
    uint256[50] private __gap;
}
