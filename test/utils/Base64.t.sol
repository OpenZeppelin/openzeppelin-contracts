// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

contract Base64Test is Test {
    function testEncode(bytes memory input) external pure {
        assertEq(Base64.encode(input), vm.toBase64(input));
        assertEq(Base64.decode(Base64.encode(input)), input);
    }

    function testEncodeURL(bytes memory input) external pure {
        assertEq(Base64.encodeURL(input), _removePadding(vm.toBase64URL(input)));
        assertEq(Base64.decode(Base64.encodeURL(input)), input);
    }

    function _removePadding(string memory inputStr) internal pure returns (string memory) {
        bytes memory input = bytes(inputStr);
        bytes memory output;

        for (uint256 i = 0; i < input.length; ++i) {
            if (input[input.length - i - 1] != 0x3d) {
                output = new bytes(input.length - i);
                break;
            }
        }

        for (uint256 i = 0; i < output.length; ++i) {
            output[i] = input[i];
        }

        return string(output);
    }
}
