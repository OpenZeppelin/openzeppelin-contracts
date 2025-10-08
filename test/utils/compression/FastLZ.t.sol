// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FastLZ} from "@openzeppelin/contracts/utils/compression/FastLZ.sol";
import {LibZip} from "solady/src/utils/LibZip.sol";

contract FastLZTest is Test {
    function testEncodeDecode(bytes memory input) external pure {
        assertEq(FastLZ.decompress(LibZip.flzCompress(input)), input);
    }

    function testEncodeDecodeCalldata(bytes memory input) external view {
        assertEq(this.decompressCalldata(LibZip.flzCompress(input)), input);
    }

    function decompressCalldata(bytes calldata input) external pure returns (bytes memory) {
        return FastLZ.decompress(input);
    }
}
