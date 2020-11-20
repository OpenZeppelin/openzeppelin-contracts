// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "../utils/Strings.sol";

contract StringsMock {
    function fromUint256(uint256 value) public pure returns (string memory) {
        return Strings.toString(value);
    }
}
