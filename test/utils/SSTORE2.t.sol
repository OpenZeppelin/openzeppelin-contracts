// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Bytes} from "@openzeppelin/contracts/utils/Bytes.sol";
import {Errors} from "@openzeppelin/contracts/utils/Errors.sol";
import {SSTORE2} from "@openzeppelin/contracts/utils/SSTORE2.sol";

contract SSTORE2Test is Test {
    function testWriteRead(bytes memory data) public {
        address pointer = SSTORE2.write(data);

        // pointer runtime code is the data prefixed with a single STOP byte
        assertEq(pointer.code.length, data.length + 1);
        assertEq(pointer.code, abi.encodePacked(hex"00", data));

        // full read round-trips
        assertEq(SSTORE2.read(pointer), data);
    }

    function testWritePreservesData(bytes memory data) public {
        bytes memory copy = bytes.concat(data);
        SSTORE2.write(data);
        // the temporary in-place memory manipulation must not corrupt the input buffer
        assertEq(data, copy);
    }

    function testReadRangeMatchesSlice(bytes memory data, uint256 start, uint256 end) public {
        address pointer = SSTORE2.write(data);
        assertEq(SSTORE2.read(pointer, start, end), Bytes.slice(data, start, end));
        assertEq(SSTORE2.read(pointer, start), Bytes.slice(data, start));
    }

    function testReadNoCode(address pointer, uint256 start, uint256 end) public view {
        vm.assume(pointer.code.length == 0);
        assertEq(SSTORE2.read(pointer), hex"");
        assertEq(SSTORE2.read(pointer, start, end), hex"");
    }

    function testWriteDeterministic(bytes memory data, bytes32 salt) public {
        address predicted = SSTORE2.computeAddress(salt, data);
        assertEq(predicted, SSTORE2.computeAddress(salt, data, address(this)));

        address pointer = SSTORE2.writeDeterministic(data, salt);
        assertEq(pointer, predicted);
        assertEq(SSTORE2.read(pointer), data);

        // reusing the same salt and data reverts
        vm.expectRevert(Errors.FailedDeployment.selector);
        this.writeDeterministic(data, salt);
    }

    function testInitCodeHash(bytes memory data) public pure {
        vm.assume(data.length <= SSTORE2.MAX_DATA_LENGTH);
        // reference construction of the creation code
        bytes memory initCode = abi.encodePacked(hex"61", uint16(data.length + 1), hex"80600A3D393DF300", data);
        assertEq(SSTORE2.initCodeHash(data), keccak256(initCode));
    }

    function testWriteDataTooLarge(uint256 length) public {
        length = bound(length, SSTORE2.MAX_DATA_LENGTH + 1, SSTORE2.MAX_DATA_LENGTH + 0x1000);
        bytes memory data = new bytes(length);

        vm.expectRevert(abi.encodeWithSelector(SSTORE2.SSTORE2DataTooLarge.selector, length));
        this.write(data);

        vm.expectRevert(abi.encodeWithSelector(SSTORE2.SSTORE2DataTooLarge.selector, length));
        this.writeDeterministic(data, bytes32(0));

        vm.expectRevert(abi.encodeWithSelector(SSTORE2.SSTORE2DataTooLarge.selector, length));
        this.initCodeHash(data);
    }

    function testMaxDataLength() public {
        bytes memory data = new bytes(SSTORE2.MAX_DATA_LENGTH);
        data[0] = 0x01;
        data[data.length - 1] = 0x01;

        address pointer = SSTORE2.write(data);
        assertEq(SSTORE2.read(pointer), data);
    }

    function testEmptyData() public {
        address pointer = SSTORE2.write(hex"");
        assertEq(pointer.code, hex"00");
        assertEq(SSTORE2.read(pointer), hex"");
    }

    // external wrappers (for expectRevert on internal library functions)
    function write(bytes memory data) external returns (address) {
        return SSTORE2.write(data);
    }

    function writeDeterministic(bytes memory data, bytes32 salt) external returns (address) {
        return SSTORE2.writeDeterministic(data, salt);
    }

    function initCodeHash(bytes memory data) external pure returns (bytes32) {
        return SSTORE2.initCodeHash(data);
    }
}
