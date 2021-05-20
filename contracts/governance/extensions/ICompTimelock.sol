// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ICompTimelock {
    receive() external payable;

    function delay() external view returns (uint256);
    function queueTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external returns (bytes32);
    function cancelTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external;
    function executeTransaction(address target, uint value, string memory signature, bytes memory data, uint eta) external payable returns (bytes memory);
}
