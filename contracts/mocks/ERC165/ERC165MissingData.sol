// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract ERC165MissingData {
    function supportsInterface(bytes4 interfaceId) public view {} // missing return
}
