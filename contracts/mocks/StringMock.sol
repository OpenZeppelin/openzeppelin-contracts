pragma solidity ^0.6.0;

import "../utils/String.sol";

contract StringMock {
    function fromUint256(uint256 value) public pure returns (string memory) {
        return String.fromUint256(value);
    }
}
