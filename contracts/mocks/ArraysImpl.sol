pragma solidity ^0.4.24;

import "../utils/Arrays.sol";

contract ArraysImpl {
    using Arrays for uint256[];

    uint256[] private array;

    constructor (uint256[] _array) public {
        array = _array;
    }

    function findUpperBound(uint256 _element) external view returns (uint256) {
        return array.findUpperBound(_element);
    }
}
