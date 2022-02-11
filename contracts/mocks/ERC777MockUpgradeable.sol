// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/ContextUpgradeable.sol";
import "../token/ERC777/ERC777Upgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC777MockUpgradeable is Initializable, ContextUpgradeable, ERC777Upgradeable {
    event BeforeTokenTransfer();

    function __ERC777Mock_init(
        address initialHolder,
        uint256 initialBalance,
        string memory name,
        string memory symbol,
        address[] memory defaultOperators
    ) internal onlyInitializing {
        __ERC777_init_unchained(name, symbol, defaultOperators);
        __ERC777Mock_init_unchained(initialHolder, initialBalance, name, symbol, defaultOperators);
    }

    function __ERC777Mock_init_unchained(
        address initialHolder,
        uint256 initialBalance,
        string memory,
        string memory,
        address[] memory
    ) internal onlyInitializing {
        _mint(initialHolder, initialBalance, "", "");
    }

    function mintInternal(
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData
    ) public {
        _mint(to, amount, userData, operatorData);
    }

    function mintInternalExtended(
        address to,
        uint256 amount,
        bytes memory userData,
        bytes memory operatorData,
        bool requireReceptionAck
    ) public {
        _mint(to, amount, userData, operatorData, requireReceptionAck);
    }

    function approveInternal(
        address holder,
        address spender,
        uint256 value
    ) public {
        _approve(holder, spender, value);
    }

    function _beforeTokenTransfer(
        address,
        address,
        address,
        uint256
    ) internal override {
        emit BeforeTokenTransfer();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
