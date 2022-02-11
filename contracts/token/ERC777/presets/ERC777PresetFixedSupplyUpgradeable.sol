// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC777/presets/ERC777PresetFixedSupply.sol)
pragma solidity ^0.8.0;

import "../ERC777Upgradeable.sol";
import "../../../proxy/utils/Initializable.sol";

/**
 * @dev {ERC777} token, including:
 *
 *  - Preminted initial supply
 *  - No access control mechanism (for minting/pausing) and hence no governance
 *
 * _Available since v3.4._
 */
contract ERC777PresetFixedSupplyUpgradeable is Initializable, ERC777Upgradeable {
    function initialize(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators,
        uint256 initialSupply,
        address owner
    ) public virtual initializer {
        __ERC777PresetFixedSupply_init(name, symbol, defaultOperators, initialSupply, owner);
    }
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     *
     * See {ERC777-constructor}.
     */
    function __ERC777PresetFixedSupply_init(
        string memory name,
        string memory symbol,
        address[] memory defaultOperators,
        uint256 initialSupply,
        address owner
    ) internal onlyInitializing {
        __ERC777_init_unchained(name, symbol, defaultOperators);
        __ERC777PresetFixedSupply_init_unchained(name, symbol, defaultOperators, initialSupply, owner);
    }

    function __ERC777PresetFixedSupply_init_unchained(
        string memory,
        string memory,
        address[] memory,
        uint256 initialSupply,
        address owner
    ) internal onlyInitializing {
        _mint(owner, initialSupply, "", "");
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
