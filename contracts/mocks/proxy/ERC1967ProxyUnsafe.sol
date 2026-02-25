// SPDX-License-Identifier: MIT

pragma solidity ^0.8.22;

import {ERC1967Proxy} from "../../proxy/ERC1967/ERC1967Proxy.sol";

contract ERC1967ProxyUnsafe is ERC1967Proxy {
    constructor(address implementation, bytes memory _data) payable ERC1967Proxy(implementation, _data) {}

    function _unsafeAllowUninitialized() internal pure override returns (bool) {
        return true;
    }
}
