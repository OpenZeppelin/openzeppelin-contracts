// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

// mock class using ERC20Pausable
contract ERC20PausableMockUpgradeable is Initializable, ERC20PausableUpgradeable {
    function __ERC20PausableMock_init(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) internal onlyInitializing {
        __ERC20_init_unchained(name, symbol);
        __Pausable_init_unchained();
        __ERC20PausableMock_init_unchained(name, symbol, initialAccount, initialBalance);
    }

    function __ERC20PausableMock_init_unchained(
        string memory,
        string memory,
        address initialAccount,
        uint256 initialBalance
    ) internal onlyInitializing {
        _mint(initialAccount, initialBalance);
    }

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
