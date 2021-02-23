// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./UUPS.sol";
import "../Proxy.sol";
import "../../utils/Address.sol";

contract UUPSProxy is Proxy {
    constructor(address _logic, bytes memory _data) payable {
        UUPS.instance().implementation = _logic;
        if (_data.length > 0) {
            Address.functionCall(_logic, _data);
        }
    }

    function _implementation() internal view virtual override returns (address) {
        return UUPS.instance().implementation;
    }
}
