// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/escrow/ConditionalEscrowUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

// mock class using ConditionalEscrow
contract ConditionalEscrowMockUpgradeable is Initializable, ConditionalEscrowUpgradeable {
    function __ConditionalEscrowMock_init() internal onlyInitializing {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Escrow_init_unchained();
        __ConditionalEscrow_init_unchained();
        __ConditionalEscrowMock_init_unchained();
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
    uint256[49] private __gap;
}
