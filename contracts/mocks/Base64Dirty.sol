// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {Base64} from "../utils/Base64.sol";

contract Base64Dirty {
    struct A {
        uint256 value;
    }

    function encode(bytes memory input) public pure returns (string memory) {
        A memory unused = A({value: type(uint256).max});
        // To silence warning
        unused;

        return Base64.encode(input);
    }
}
