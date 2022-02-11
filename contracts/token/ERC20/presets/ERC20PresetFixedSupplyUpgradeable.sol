// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC20/presets/ERC20PresetFixedSupply.sol)
pragma solidity ^0.8.0;

import "../extensions/ERC20BurnableUpgradeable.sol";
import "../../../proxy/utils/Initializable.sol";

/**
 * @dev {ERC20} token, including:
 *
 *  - Preminted initial supply
 *  - Ability for holders to burn (destroy) their tokens
 *  - No access control mechanism (for minting/pausing) and hence no governance
 *
 * This contract uses {ERC20Burnable} to include burn capabilities - head to
 * its documentation for details.
 *
 * _Available since v3.4._
 *
 * _Deprecated in favor of https://wizard.openzeppelin.com/[Contracts Wizard]._
 */
contract ERC20PresetFixedSupplyUpgradeable is Initializable, ERC20BurnableUpgradeable {
    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) public virtual initializer {
        __ERC20PresetFixedSupply_init(name, symbol, initialSupply, owner);
    }
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     *
     * See {ERC20-constructor}.
     */
    function __ERC20PresetFixedSupply_init(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) internal onlyInitializing {
        __ERC20_init_unchained(name, symbol);
        __ERC20PresetFixedSupply_init_unchained(name, symbol, initialSupply, owner);
    }

    function __ERC20PresetFixedSupply_init_unchained(
        string memory,
        string memory,
        uint256 initialSupply,
        address owner
    ) internal onlyInitializing {
        _mint(owner, initialSupply);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
