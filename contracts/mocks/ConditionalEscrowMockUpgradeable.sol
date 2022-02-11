// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/escrow/ConditionalEscrowUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

// mock class using ConditionalEscrow
contract ConditionalEscrowMockUpgradeable is Initializable, ConditionalEscrowUpgradeable {
    function __ConditionalEscrowMock_init() internal onlyInitializing {
        __Ownable_init_unchained();
    }

    function __ConditionalEscrowMock_init_unchained() internal onlyInitializing {
    }
    mapping(address => bool) private _allowed;

    function setAllowed(address payee, bool allowed) public {
        _allowed[payee] = allowed;
    }

    function withdrawalAllowed(address payee) public view override returns (bool) {
        return _allowed[payee];
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
