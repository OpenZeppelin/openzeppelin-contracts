// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./UUPS.sol";

abstract contract UUPSProxiable is UUPS {
    function proxiableUUID() public view returns (bytes32) {
        return _uuid();
    }

    function _updateCodeAddress(address newAddress) internal {
        require(_uuid() == UUPSProxiable(newAddress).proxiableUUID(), "UUPS: new impelmentation is not compatible");
        _upgradeTo(newAddress);
    }
}
