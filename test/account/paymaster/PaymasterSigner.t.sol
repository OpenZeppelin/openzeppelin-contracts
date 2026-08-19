// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AccountEIP7702Mock} from "@openzeppelin/contracts/mocks/account/AccountMock.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignerECDSA} from "@openzeppelin/contracts/utils/cryptography/signers/SignerECDSA.sol";
import {PaymasterSigner} from "@openzeppelin/contracts/account/paymaster/extensions/PaymasterSigner.sol";
import {PackedUserOperation} from "@openzeppelin/contracts/interfaces/IERC4337.sol";

contract PaymasterSignerHarness is PaymasterSigner, SignerECDSA {
    constructor(address signerAddr) EIP712("PaymasterSignerHarness", "1") SignerECDSA(signerAddr) {}

    function signableUserOpHash(
        PackedUserOperation calldata userOp,
        uint48 validAfter,
        uint48 validUntil
    ) external view returns (bytes32) {
        return _signableUserOpHash(userOp, validAfter, validUntil);
    }
}

contract DelegateMockA is AccountEIP7702Mock {
    constructor() EIP712("Delegate", "1") {}
}

contract DelegateMockB is AccountEIP7702Mock {
    constructor() EIP712("Delegate", "1") {}
}

contract PaymasterSignerEIP7702Test is Test {
    PaymasterSignerHarness private _paymaster;
    address private _sender;
    address private _delegateA;
    address private _delegateB;

    function setUp() public {
        _paymaster = new PaymasterSignerHarness(makeAddr("paymasterSigner"));
        _sender = makeAddr("eip7702Sender");
        _delegateA = address(new DelegateMockA());
        _delegateB = address(new DelegateMockB());
    }

    // Regression against a fix that only detected `initCode.length >= 20`. The EntryPoint's
    // Eip7702Support._isEip7702InitCode accepts any initCode of length >= 2 whose first 20 bytes
    // (calldata-padded with zeros) match the marker, so a 2-byte initCode must bind the delegate too.
    function testDigestBindsDelegateForShortMarker() public {
        _assertDelegateAffectsDigest(hex"7702");
    }

    function testDigestBindsDelegateForFullMarker() public {
        _assertDelegateAffectsDigest(hex"7702000000000000000000000000000000000000");
    }

    function testDigestBindsDelegateForMarkerWithInitData() public {
        _assertDelegateAffectsDigest(hex"7702000000000000000000000000000000000000deadbeef");
    }

    // A factory address whose first two bytes are 0x7702 is NOT an EIP-7702 initCode: EntryPoint's
    // Eip7702Support._isEip7702InitCode compares all 20 leading bytes against the marker padded with
    // 18 zeros, so a nonzero tail makes this a regular factory deployment. The digest must therefore
    // hash the raw initCode and stay independent of whatever code sits at `sender`.
    function testDigestIgnoresDelegateForNonZeroTailFactory() public {
        bytes memory initCode = hex"7702aabbccddeeff00112233445566778899aabb";

        _installDelegate(_sender, _delegateA);
        bytes32 hashA = _paymaster.signableUserOpHash(_userOp(initCode), 0, 0);

        _installDelegate(_sender, _delegateB);
        bytes32 hashB = _paymaster.signableUserOpHash(_userOp(initCode), 0, 0);

        assertEq(hashA, hashB, "digest must not bind a delegate for a non-EIP-7702 initCode");
    }

    function _assertDelegateAffectsDigest(bytes memory initCode) private {
        _installDelegate(_sender, _delegateA);
        bytes32 hashA = _paymaster.signableUserOpHash(_userOp(initCode), 0, 0);

        _installDelegate(_sender, _delegateB);
        bytes32 hashB = _paymaster.signableUserOpHash(_userOp(initCode), 0, 0);

        assertNotEq(hashA, hashB, "digest must bind the effective EIP-7702 delegate");
    }

    function _userOp(bytes memory initCode) private view returns (PackedUserOperation memory op) {
        op.sender = _sender;
        op.initCode = initCode;
    }

    function _installDelegate(address account, address delegate) private {
        vm.etch(account, abi.encodePacked(bytes3(0xef0100), delegate));
    }
}
