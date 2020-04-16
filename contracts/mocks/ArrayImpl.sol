pragma solidity ^0.6.0;

import "../utils/Array.sol";

contract ArrayImpl {
    using Array for uint256[];

    uint256[] private _array;

    constructor (uint256[] memory array) public {
        _array = array;
    }

    function findUpperBound(uint256 element) external view returns (uint256) {
        return _array.findUpperBound(element);
    }
}
