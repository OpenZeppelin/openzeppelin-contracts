// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../introspection/ERC165Checker.sol";

contract ERC165CheckerMock {
    using ERC165Checker for address;

    function supportsERC165(address account) public view returns (bool) {
        return account.supportsERC165();
    }

    function supportsInterface(address account, bytes4 interfaceId) public view returns (bool) {
        return account.supportsInterface(interfaceId);
    }

    function supportsAllInterfaces(address account, bytes4[] memory interfaceIds) public view returns (bool) {
        return account.supportsAllInterfaces(interfaceIds);
    }

    function getSupportedInterfaces(address account, bytes4[] memory interfaceIds) public view returns (bool[] memory) {
        return account.getSupportedInterfaces(interfaceIds);
    }
}
