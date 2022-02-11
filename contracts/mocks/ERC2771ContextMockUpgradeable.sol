// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "./ContextMockUpgradeable.sol";
import "../metatx/ERC2771ContextUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

// By inheriting from ERC2771Context, Context's internal functions are overridden automatically
contract ERC2771ContextMockUpgradeable is Initializable, ContextMockUpgradeable, ERC2771ContextUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address trustedForwarder) ERC2771ContextUpgradeable(trustedForwarder) {
        emit Sender(_msgSender()); // _msgSender() should be accessible during construction
    }

    function _msgSender() internal view virtual override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal view virtual override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}
