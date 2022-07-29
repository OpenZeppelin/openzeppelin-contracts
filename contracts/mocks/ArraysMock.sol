// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Arrays.sol";

contract Uint256ArraysMock {
    using Arrays for uint256[];

    uint256[] private _array;

    constructor(uint256[] memory array) {
        _array = array;
    }

    function findUpperBound(uint256 element) external view returns (uint256) {
        return _array.findUpperBound(element);
    }

    function unsafeAccess(uint256 pos) external view returns (uint256) {
        return _array.unsafeAccess(pos).value;
    }
}

contract AddressArraysMock {
    using Arrays for address[];

    address[] private _array;

    constructor(address[] memory array) {
        _array = array;
    }

    function unsafeAccess(uint256 pos) external view returns (address) {
        return _array.unsafeAccess(pos).value;
    }
}

contract Bytes32ArraysMock {
    using Arrays for bytes32[];

    bytes32[] private _array;

    constructor(bytes32[] memory array) {
        _array = array;
    }

    function unsafeAccess(uint256 pos) external view returns (bytes32) {
        return _array.unsafeAccess(pos).value;
    }
}
