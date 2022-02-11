// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/ERC20Upgradeable.sol";
import "../proxy/utils/Initializable.sol";

// mock class using ERC20
contract ERC20MockUpgradeable is Initializable, ERC20Upgradeable {
    function __ERC20Mock_init(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) internal onlyInitializing {
        __ERC20_init_unchained(name, symbol);
        __ERC20Mock_init_unchained(name, symbol, initialAccount, initialBalance);
    }

    function __ERC20Mock_init_unchained(
        string memory,
        string memory,
        address initialAccount,
        uint256 initialBalance
    ) internal onlyInitializing {
        _mint(initialAccount, initialBalance);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function transferInternal(
        address from,
        address to,
        uint256 value
    ) public {
        _transfer(from, to, value);
    }

    function approveInternal(
        address owner,
        address spender,
        uint256 value
    ) public {
        _approve(owner, spender, value);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
