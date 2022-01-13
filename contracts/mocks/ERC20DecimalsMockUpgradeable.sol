// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/ERC20Upgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract ERC20DecimalsMockUpgradeable is Initializable, ERC20Upgradeable {
    uint8 private _decimals;

    function __ERC20DecimalsMock_init(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) internal onlyInitializing {
        __Context_init_unchained();
        __ERC20_init_unchained(name_, symbol_);
        __ERC20DecimalsMock_init_unchained(name_, symbol_, decimals_);
    }

    function __ERC20DecimalsMock_init_unchained(
        string memory,
        string memory,
        uint8 decimals_
    ) internal onlyInitializing {
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    uint256[50] private __gap;
}
