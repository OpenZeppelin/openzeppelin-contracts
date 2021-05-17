// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC725 {
    event DataChanged(bytes32 indexed key, bytes32 indexed value);
    event ContractCreated(address indexed contractAddress);

    function getData(bytes32 key) external view returns (bytes32 value);
    function setData(bytes32 key, bytes32 value) external;
    function execute(uint256 operationType, address to, uint256 value, bytes calldata _data) external;
}
