// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AccountEIP7702Mock} from "@openzeppelin/contracts/mocks/account/AccountMock.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ERC4337Utils} from "@openzeppelin/contracts/account/utils/ERC4337Utils.sol";
import {PackedUserOperation} from "@openzeppelin/contracts/interfaces/IERC4337.sol";

contract ERC4337UtilsHarness {
    function initCodeHash(PackedUserOperation calldata userOp) external view returns (bytes32) {
        return ERC4337Utils.initCodeHash(userOp);
    }
}

contract DelegateMock is AccountEIP7702Mock {
    constructor() EIP712("Delegate", "1") {}
}

contract ERC4337UtilsInitCodeHashTest is Test {
    bytes constant EIP7702_MARKER = hex"7702000000000000000000000000000000000000";

    ERC4337UtilsHarness private _harness;
    address private _sender;
    address private _delegateA;
    address private _delegateB;

    function setUp() public {
        _harness = new ERC4337UtilsHarness();
        _sender = makeAddr("eip7702Sender");
        _delegateA = address(new DelegateMock());
        _delegateB = address(new DelegateMock());
    }

    // Regression against a check that required `initCode.length >= 20`. The EntryPoint's
    // Eip7702Support._isEip7702InitCode accepts any initCode of length >= 2 whose first 20 bytes
    // (calldata-padded with zeros) match the marker, so a 2-byte initCode must bind the delegate too.
    function testHashBindsDelegateForShortMarker() public {
        bytes32 hashA = _installDelegateAndHashUserOp(_delegateA, hex"7702");
        bytes32 hashB = _installDelegateAndHashUserOp(_delegateB, hex"7702");

        assertEq(hashA, keccak256(abi.encodePacked(_delegateA)), "hash must bind the effective EIP-7702 delegate");
        assertEq(hashB, keccak256(abi.encodePacked(_delegateB)), "hash must bind the effective EIP-7702 delegate");
        assertNotEq(hashA, hashB, "hash must bind the effective EIP-7702 delegate");
    }

    function testHashBindsDelegateForFullMarker() public {
        bytes32 hashA = _installDelegateAndHashUserOp(_delegateA, EIP7702_MARKER);
        bytes32 hashB = _installDelegateAndHashUserOp(_delegateB, EIP7702_MARKER);

        assertEq(hashA, keccak256(abi.encodePacked(_delegateA)), "hash must bind the effective EIP-7702 delegate");
        assertEq(hashB, keccak256(abi.encodePacked(_delegateB)), "hash must bind the effective EIP-7702 delegate");
        assertNotEq(hashA, hashB, "hash must bind the effective EIP-7702 delegate");
    }

    function testHashBindsDelegateForMarkerWithInitData() public {
        bytes32 hashA = _installDelegateAndHashUserOp(_delegateA, bytes.concat(EIP7702_MARKER, hex"deadbeef"));
        bytes32 hashB = _installDelegateAndHashUserOp(_delegateB, bytes.concat(EIP7702_MARKER, hex"deadbeef"));

        assertEq(
            hashA,
            keccak256(abi.encodePacked(_delegateA, hex"deadbeef")),
            "hash must bind the effective EIP-7702 delegate"
        );
        assertEq(
            hashB,
            keccak256(abi.encodePacked(_delegateB, hex"deadbeef")),
            "hash must bind the effective EIP-7702 delegate"
        );
        assertNotEq(hashA, hashB, "hash must bind the effective EIP-7702 delegate");
    }

    function testHashIncludesInitData() public {
        bytes32 hashA = _installDelegateAndHashUserOp(_delegateA, bytes.concat(EIP7702_MARKER, hex"deadbeef"));
        bytes32 hashB = _installDelegateAndHashUserOp(_delegateA, bytes.concat(EIP7702_MARKER, hex"cafebabe"));

        assertEq(
            hashA,
            keccak256(abi.encodePacked(_delegateA, hex"deadbeef")),
            "hash must bind the effective EIP-7702 delegate"
        );
        assertEq(
            hashB,
            keccak256(abi.encodePacked(_delegateA, hex"cafebabe")),
            "hash must bind the effective EIP-7702 delegate"
        );
        assertNotEq(hashA, hashB, "hash must bind the effective EIP-7702 delegate");
    }

    function testHashIgnoresDelegateForNonZeroTailFactory() public {
        bytes32 hashA = _installDelegateAndHashUserOp(_delegateA, hex"7702aabbccddeeff00112233445566778899aabb");
        bytes32 hashB = _installDelegateAndHashUserOp(_delegateB, hex"7702aabbccddeeff00112233445566778899aabb");

        assertEq(
            hashA,
            keccak256(hex"7702aabbccddeeff00112233445566778899aabb"),
            "hash must not bind a delegate for a non-EIP-7702 initCode"
        );
        assertEq(
            hashB,
            keccak256(hex"7702aabbccddeeff00112233445566778899aabb"),
            "hash must not bind a delegate for a non-EIP-7702 initCode"
        );
        assertEq(hashA, hashB, "hash must not bind a delegate for a non-EIP-7702 initCode");
    }

    function _installDelegateAndHashUserOp(address delegate, bytes memory initCode) private returns (bytes32 hash) {
        vm.etch(_sender, abi.encodePacked(bytes3(0xef0100), delegate));
        return _harness.initCodeHash(_userOp(initCode));
    }

    function _userOp(bytes memory initCode) private view returns (PackedUserOperation memory op) {
        op.sender = _sender;
        op.initCode = initCode;
    }
}
