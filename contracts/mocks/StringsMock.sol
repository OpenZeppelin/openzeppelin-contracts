pragma solidity ^0.6.0;

import "../utils/Strings.sol";

contract StringsMock {
    function toString(uint256 value) public pure returns (string memory) {
        return Strings.toString(value);
    }
}
