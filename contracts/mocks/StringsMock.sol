// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../utils/Strings.sol";

contract StringsMock {
    string public integerLiteralConversion;

    constructor() {
        integerLiteralConversion = string.concat(
            Strings.toStringSigned(100),
            " Integer literal conversion successful!"
        );
    }
}
