// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC1271
{
    function isValidSignature(bytes calldata data, bytes calldata signature) external view returns (bytes4 magicValue);
}
