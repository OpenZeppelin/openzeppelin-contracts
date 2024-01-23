// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// NOTE: This test requires `ffi` to be enabled. It does not run in the CI
/// environment given `ffi` is not recommended.
/// See: https://github.com/foundry-rs/foundry/issues/6744
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
