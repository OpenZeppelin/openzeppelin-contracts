// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../introspection/ERC165Storage.sol";

contract ERC165StorageMock is ERC165Storage {
    function registerInterface(bytes4 interfaceId) public {
        _registerInterface(interfaceId);
    }
}
