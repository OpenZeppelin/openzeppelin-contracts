// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {RLP} from "@openzeppelin/contracts/utils/RLP.sol";
import {Memory} from "@openzeppelin/contracts/utils/Memory.sol";

contract RLPTest is Test {
    using RLP for *;

    // Encode -> Decode

    function testEncodeDecodeBool(bool input) external pure {
        assertEq(input.encode().decodeBool(), input);
    }

    function testEncodeDecodeAddress(address input) external pure {
        assertEq(input.encode().decodeAddress(), input);
    }

    function testEncodeDecodeUint256(uint256 input) external pure {
        assertEq(input.encode().decodeUint256(), input);
    }

    function testEncodeDecodeBytes32(bytes32 input) external pure {
        assertEq(input.encode().decodeBytes32(), input);
    }

    function testEncodeDecodeBytes(bytes memory input) external pure {
        assertEq(input.encode().decodeBytes(), input);
    }

    function testEncodeDecodeString(string memory input) external pure {
        assertEq(input.encode().decodeString(), input);
    }

    /// forge-config: default.fuzz.runs = 512
    function testEncodeDecodeList(bytes[] memory input) external pure {
        // max length for list decoding by default
        vm.assume(input.length <= 32);

        bytes[] memory encoded = new bytes[](input.length);
        for (uint256 i = 0; i < input.length; ++i) {
            encoded[i] = input[i].encode();
        }

        // encode list + decode as list of RLP items
        Memory.Slice[] memory list = encoded.encode().decodeList();

        assertEq(list.length, input.length);
        for (uint256 i = 0; i < input.length; ++i) {
            assertEq(list[i].readBytes(), input[i]);
        }
    }

    // List encoder

    function testEncodeEmpty() external pure {
        assertEq(RLP.encoder().encode(), hex"c0");
    }

    function testEncodeBool(bool input) external pure {
        bytes[] memory list = new bytes[](1);
        list[0] = RLP.encode(input);

        assertEq(RLP.encoder().push(input).encode(), RLP.encode(list));
    }

    function testEncodeAddress(address input) external pure {
        bytes[] memory list = new bytes[](1);
        list[0] = RLP.encode(input);

        assertEq(RLP.encoder().push(input).encode(), RLP.encode(list));
    }

    function testEncodeUint256(uint256 input) external pure {
        bytes[] memory list = new bytes[](1);
        list[0] = RLP.encode(input);

        assertEq(RLP.encoder().push(input).encode(), RLP.encode(list));
    }

    function testEncodeBytes32(bytes32 input) external pure {
        bytes[] memory list = new bytes[](1);
        list[0] = RLP.encode(input);

        assertEq(RLP.encoder().push(input).encode(), RLP.encode(list));
    }

    function testEncodeBytes(bytes memory input) external pure {
        bytes[] memory list = new bytes[](1);
        list[0] = RLP.encode(input);

        assertEq(RLP.encoder().push(input).encode(), RLP.encode(list));
    }

    function testEncodeString(string memory input) external pure {
        bytes[] memory list = new bytes[](1);
        list[0] = RLP.encode(input);

        assertEq(RLP.encoder().push(input).encode(), RLP.encode(list));
    }

    /// forge-config: default.fuzz.runs = 512
    function testEncodeBytesArray(bytes[] memory input) external pure {
        bytes[] memory list = new bytes[](1);
        list[0] = RLP.encode(input);

        assertEq(RLP.encoder().push(input).encode(), RLP.encode(list));
    }

    function testEncodeEncoder(bytes memory input) external pure {
        bytes[] memory list = new bytes[](1);
        list[0] = RLP.encode(input);
        list[0] = RLP.encode(list);

        assertEq(RLP.encoder().push(RLP.encoder().push(input)).encode(), RLP.encode(list));
    }

    function testEncodeMultiType(uint256 u, bytes memory b, address a) external pure {
        bytes[] memory list = new bytes[](3);
        list[0] = RLP.encode(u);
        list[1] = RLP.encode(b);
        list[2] = RLP.encode(a);

        assertEq(RLP.encoder().push(u).push(b).push(a).encode(), RLP.encode(list));

        list[0] = RLP.encode(b);
        list[1] = RLP.encode(a);
        list[2] = RLP.encode(u);

        assertEq(RLP.encoder().push(b).push(a).push(u).encode(), RLP.encode(list));
    }

    function testComputeCreateAddress(address deployer, uint256 nonce) external pure {
        nonce = bound(nonce, 0, type(uint64).max);

        assertEq(
            address(uint160(uint256(keccak256(RLP.encoder().push(deployer).push(nonce).encode())))),
            vm.computeCreateAddress(deployer, nonce)
        );
    }

    // Trailing bytes: the decoded item must consume the entire buffer.

    function testDecodeUint256RejectsTrailing() external {
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeUint256Ext(hex"82000100");
    }

    function testDecodeUint256RejectsTrailingAfterSingleByte() external {
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeUint256Ext(hex"01ff");
    }

    function testDecodeBytesRejectsTrailing() external {
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeBytesExt(hex"83616263deadbeef");
    }

    function testDecodeBytes32RejectsTrailing() external {
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeBytes32Ext(hex"82000100");
    }

    function testDecodeBoolRejectsTrailing() external {
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeBoolExt(hex"01ff");
    }

    function testDecodeStringRejectsTrailing() external {
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeStringExt(hex"83616263deadbeef");
    }

    // `require(length == 1 || length == 21)` checks the slice length, not the item length. Before the fix, a 21-byte
    // buffer `0x81 FF ‖ <19 arbitrary bytes>` would decode to `address(uint160(0xFF))`, the same as the canonical
    // `0x94 ‖ 0x00…00FF` encoding, yielding 2^152 distinct encodings for the same address.
    function testDecodeAddressRejectsTrailing() external {
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeAddressExt(abi.encodePacked(hex"81ff", new bytes(19)));
    }

    function testFuzzDecodeAddressRejectsAllTrailingVariants(bytes19 junk) external {
        bytes memory buf = abi.encodePacked(hex"81ff", junk);
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeAddressExt(buf);
    }

    function testFuzzDecodeBytesRejectsAnyNonEmptySuffix(bytes memory value, bytes memory junk) external {
        vm.assume(junk.length > 0);
        bytes memory polluted = bytes.concat(RLP.encode(value), junk);
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeBytesExt(polluted);
    }

    // Control: {decodeList} already enforces exact consumption at the outer level.
    function testDecodeListRejectsTrailing() external {
        vm.expectRevert(RLP.RLPInvalidEncoding.selector);
        this.decodeListExt(hex"c382000100");
    }

    // External wrappers — `vm.expectRevert` needs an external call to observe a library revert.

    function decodeUint256Ext(bytes memory item) external pure returns (uint256) {
        return RLP.decodeUint256(item);
    }

    function decodeBytesExt(bytes memory item) external pure returns (bytes memory) {
        return RLP.decodeBytes(item);
    }

    function decodeBytes32Ext(bytes memory item) external pure returns (bytes32) {
        return RLP.decodeBytes32(item);
    }

    function decodeBoolExt(bytes memory item) external pure returns (bool) {
        return RLP.decodeBool(item);
    }

    function decodeStringExt(bytes memory item) external pure returns (string memory) {
        return RLP.decodeString(item);
    }

    function decodeAddressExt(bytes memory item) external pure returns (address) {
        return RLP.decodeAddress(item);
    }

    function decodeListExt(bytes memory item) external pure returns (uint256) {
        return RLP.decodeList(item).length;
    }
}
