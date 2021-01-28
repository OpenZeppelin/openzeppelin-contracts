// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../introspection/IERC165.sol";

contract ERC165Mock is IERC165 {
    /**
     * @dev A mapping of interface id to whether or not it's supported.
     */
    mapping(bytes4 => bool) private _supportedInterfaces;

    /**
     * @dev A contract implementing SupportsInterfaceWithLookup
     * implement ERC165 itself.
     */
    constructor () {
        registerInterface(type(IERC165).interfaceId);
    }

    /**
     * @dev Implement supportsInterface(bytes4) using a lookup table.
     */
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return _supportedInterfaces[interfaceId];
    }

    function registerInterface(bytes4 interfaceId) public {
        require(interfaceId != 0xffffffff, "ERC165: invalid interface id");
        _supportedInterfaces[interfaceId] = true;
    }
}
