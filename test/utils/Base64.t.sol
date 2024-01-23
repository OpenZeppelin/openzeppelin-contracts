// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract Base64Test is Test {
    function testEncode(bytes memory input) external {
        string memory output = Base64.encode(input);
        assertEq(output, vm.toBase64(input));
    }

    function testEncodeURL(bytes memory input) external {
        string memory output = Base64.encodeURL(input);
        assertEq(output, _removePadding(vm.toBase64URL(input)));
    }

    function _removePadding(string memory input) internal pure returns (string memory) {
        bytes memory bytesInput = bytes(input);
        uint256 length = bytesInput.length;
        if (length == 0) return input;

        uint256 padding = 0;

        while (bytesInput[length - padding - 1] == 0x3d) {
            padding++;
        }

        bytes memory result = new bytes(length - padding);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = bytesInput[i];
        }

        return string(result);
    }
}
