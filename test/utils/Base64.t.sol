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
        assertEq(output, _base64Ffi(input, "encode"));
    }

    function testEncodeURL(bytes memory input) external {
        string memory output = Base64.encodeURL(input);
        assertEq(output, _base64Ffi(input, "encodeURL"));
    }

    function _base64Ffi(bytes memory input, string memory fn) internal returns (string memory) {
        string[] memory command = new string[](4);
        command[0] = "bash";
        command[1] = "scripts/tests/base64.sh";
        command[2] = fn;
        command[3] = vm.toString(input);
        bytes memory retData = vm.ffi(command);
        return string(retData);
    }
}
