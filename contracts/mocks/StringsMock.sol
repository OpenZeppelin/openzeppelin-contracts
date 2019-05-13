pragma solidity ^0.5.0;

import "../drafts/Strings.sol";

contract StringsMock {
    function concatenate(string memory a, string memory b) public pure returns (string memory) {
        return Strings.concatenate(a, b);
    }

    function uint256ToString(uint256 value) public pure returns (string memory) {
        return Strings.uint256ToString(value);
    }
}