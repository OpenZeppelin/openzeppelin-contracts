// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ERC7964Mock} from "@openzeppelin/contracts/mocks/utils/cryptography/ERC7964Mock.sol";

contract SignatureCheckerTest is Test {
    function testParseCrossChainSignature(
        bytes1 fields,
        uint16 structIndex,
        address application,
        bytes32[] memory structsArray,
        bytes memory crossChainSignature
    ) public view {
        bytes memory signature = abi.encode(
            _encodeHeader(fields, structIndex, application),
            structsArray,
            crossChainSignature
        );
        _assertParsed(this.parse(signature), fields, structIndex, application, structsArray, crossChainSignature);
        _assertParsed(
            this.parseCalldata(signature),
            fields,
            structIndex,
            application,
            structsArray,
            crossChainSignature
        );
    }

    /// @dev Parsing never reverts, and a successful parse matches `abi.decode`.
    function testParseCrossChainSignatureArbitraryData(bytes memory data) public view {
        ParseResult memory result = this.parse(data);
        _assertEq(result, this.parseCalldata(data));

        if (result.crossChainSignature.length == 0 && result.structsArray.length == 0) return;
        (bytes32 header, bytes32[] memory structsArray, bytes memory crossChainSignature) = abi.decode(
            data,
            (bytes32, bytes32[], bytes)
        );
        assertEq(bytes9(header), SignatureChecker.ERC7964_MAGIC);
        _assertParsed(
            result,
            bytes1(header << 72),
            uint16(bytes2(header << 80)),
            address(bytes20(header << 96)),
            structsArray,
            crossChainSignature
        );
    }

    /// @dev Parsing never reverts with arbitrary offsets and lengths, and succeeds iff they are within bounds.
    function testParseCrossChainSignatureMalformedOffsets(
        uint256 structsArrayOffset,
        uint256 structsArrayLength,
        uint256 crossChainSignatureOffset,
        uint256 crossChainSignatureLength,
        uint8 tailWords,
        uint8 variant
    ) public view {
        // Pick small values (in bounds or near bounds) for half of the runs, and any value otherwise
        if (variant % 2 == 0) {
            structsArrayOffset = bound(structsArrayOffset, 0, 0x200);
            structsArrayLength = bound(structsArrayLength, 0, 0x10);
            crossChainSignatureOffset = bound(crossChainSignatureOffset, 0, 0x400);
            crossChainSignatureLength = bound(crossChainSignatureLength, 0, 0x200);
        }

        bytes memory signature = abi.encodePacked(
            _encodeHeader(0x03, 0, address(this)),
            structsArrayOffset,
            crossChainSignatureOffset,
            new bytes(uint256(tailWords) * 0x20)
        );
        // Write lengths at their offsets (when they fall within the signature), then read them back since unaligned
        // offsets may overlap
        bool structsArrayInBounds = structsArrayOffset >= 0x60 && structsArrayOffset <= signature.length - 0x20;
        bool crossChainSignatureInBounds = crossChainSignatureOffset >= 0x60 &&
            crossChainSignatureOffset <= signature.length - 0x20;
        if (structsArrayInBounds) _store(signature, structsArrayOffset, structsArrayLength);
        if (crossChainSignatureInBounds) _store(signature, crossChainSignatureOffset, crossChainSignatureLength);
        structsArrayLength = structsArrayInBounds ? _load(signature, structsArrayOffset) : 0;
        crossChainSignatureLength = crossChainSignatureInBounds ? _load(signature, crossChainSignatureOffset) : 0;

        bool expected = signature.length >= 0xa0 &&
            structsArrayOffset >= 0x60 &&
            structsArrayOffset <= signature.length - 0x20 &&
            structsArrayLength <= (signature.length - structsArrayOffset - 0x20) / 0x20 &&
            crossChainSignatureOffset >= structsArrayOffset + 0x20 + structsArrayLength * 0x20 &&
            crossChainSignatureOffset <= signature.length - 0x20 &&
            crossChainSignatureLength <= signature.length - crossChainSignatureOffset - 0x20;

        ParseResult memory result = this.parse(signature);
        _assertEq(result, this.parseCalldata(signature));
        assertEq(result.fields, expected ? bytes1(0x03) : bytes1(0));
        assertEq(result.application, expected ? address(this) : address(0));
        assertEq(result.structsArray.length, expected ? structsArrayLength : 0);
        assertEq(result.crossChainSignature.length, expected ? crossChainSignatureLength : 0);
    }

    function testIsValidCrossChainSignature(
        uint256 privateKey,
        uint256 value,
        uint8 operationsCount,
        uint8 structIndex
    ) public {
        privateKey = bound(privateKey, 1, 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140);
        operationsCount = uint8(bound(operationsCount, 1, 16));
        structIndex = uint8(bound(structIndex, 0, operationsCount - 1));

        ERC7964Mock app = new ERC7964Mock("ERC7964Mock", "1");

        // Operations for other chains, with the operation for `app` on the current chain at `structIndex`
        bytes32[] memory structsArray = new bytes32[](operationsCount);
        for (uint256 i = 0; i < operationsCount; ++i) {
            structsArray[i] = i == structIndex ? app.operationHash(value) : keccak256(abi.encode(i));
        }

        address signer = vm.addr(privateKey);
        bytes memory crossChainSignature = _signCrossChain(app, privateKey, structsArray);

        bytes memory signature = abi.encode(
            _encodeHeader(0x03, structIndex, address(app)),
            structsArray,
            crossChainSignature
        );
        assertTrue(app.isValidSetValueSignature(signer, value, signature));
        assertTrue(app.isValidSetValueSignatureCalldata(signer, value, signature));

        // Pointing to any other operation fails
        signature = abi.encode(
            _encodeHeader(0x03, uint16(structIndex) + 1, address(app)),
            structsArray,
            crossChainSignature
        );
        assertFalse(app.isValidSetValueSignature(signer, value, signature));
        assertFalse(app.isValidSetValueSignatureCalldata(signer, value, signature));
    }

    struct ParseResult {
        bytes1 fields;
        uint16 structIndex;
        address application;
        bytes32[] structsArray;
        bytes crossChainSignature;
    }

    function parse(bytes memory signature) external pure returns (ParseResult memory r) {
        (r.fields, r.structIndex, r.application, r.structsArray, r.crossChainSignature) = SignatureChecker
            .tryParseCrossChainSignature(signature);
    }

    function parseCalldata(bytes calldata signature) external pure returns (ParseResult memory r) {
        (r.fields, r.structIndex, r.application, r.structsArray, r.crossChainSignature) = SignatureChecker
            .tryParseCrossChainSignatureCalldata(signature);
    }

    function _signCrossChain(
        ERC7964Mock app,
        uint256 privateKey,
        bytes32[] memory structsArray
    ) private view returns (bytes memory) {
        (, string memory name, string memory version, , , , ) = app.eip712Domain();
        bytes32 digest = MessageHashUtils.toTypedDataHash(
            MessageHashUtils.toDomainSeparator(0x03, name, version, 0, address(0), bytes32(0)),
            keccak256(abi.encode(app.SET_VALUE_TYPEHASH(), keccak256(abi.encodePacked(structsArray)), app.nonce()))
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function _encodeHeader(bytes1 fields, uint16 structIndex, address application) private pure returns (bytes32) {
        return bytes32(abi.encodePacked(SignatureChecker.ERC7964_MAGIC, fields, structIndex, application));
    }

    function _store(bytes memory buffer, uint256 offset, uint256 value) private pure {
        assembly ("memory-safe") {
            mstore(add(add(buffer, 0x20), offset), value)
        }
    }

    function _load(bytes memory buffer, uint256 offset) private pure returns (uint256 value) {
        assembly ("memory-safe") {
            value := mload(add(add(buffer, 0x20), offset))
        }
    }

    function _assertParsed(
        ParseResult memory result,
        bytes1 fields,
        uint16 structIndex,
        address application,
        bytes32[] memory structsArray,
        bytes memory crossChainSignature
    ) private pure {
        assertEq(result.fields, fields);
        assertEq(result.structIndex, structIndex);
        assertEq(result.application, application);
        assertEq(result.structsArray, structsArray);
        assertEq(result.crossChainSignature, crossChainSignature);
    }

    function _assertEq(ParseResult memory a, ParseResult memory b) private pure {
        _assertParsed(a, b.fields, b.structIndex, b.application, b.structsArray, b.crossChainSignature);
    }
}
