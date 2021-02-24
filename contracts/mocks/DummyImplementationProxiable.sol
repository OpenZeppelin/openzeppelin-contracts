// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./DummyImplementation.sol";
import "../proxy/uups/UUPSProxiable.sol";

contract DummyImplementationProxiable is DummyImplementation, UUPSProxiable {
    function updateCodeAddress(address newImplementation) public {
        _updateCodeAddress(newImplementation);
    }
}

contract DummyImplementationV2Proxiable is DummyImplementationV2, UUPSProxiable {
    function updateCodeAddress(address newImplementation) public {
        _updateCodeAddress(newImplementation);
    }
}
