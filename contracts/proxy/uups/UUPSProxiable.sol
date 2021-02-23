// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./UUPS.sol";

contract UUPSProxiable {
    function proxiableUUID() public pure returns (bytes32) {
        return UUPS.uuid();
    }

    function _updateCodeAddress(address newAddress) internal {
        require(UUPS.uuid() == UUPSProxiable(newAddress).proxiableUUID(), "Not compatible");
        UUPS.instance().implementation = newAddress;
    }
}
