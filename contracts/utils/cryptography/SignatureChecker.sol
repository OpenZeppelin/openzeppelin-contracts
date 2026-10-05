// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (utils/cryptography/SignatureChecker.sol)

pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {IERC5267} from "../../interfaces/IERC5267.sol";
import {IERC7913SignatureVerifier} from "../../interfaces/IERC7913.sol";
import {Bytes} from "../Bytes.sol";
import {Calldata} from "../Calldata.sol";
import {Memory} from "../Memory.sol";
import {ECDSA} from "./ECDSA.sol";
import {MessageHashUtils} from "./MessageHashUtils.sol";

/**
 * @dev Signature verification helper that can be used instead of `ECDSA.recover` to seamlessly support:
 *
 * * ECDSA signatures from externally owned accounts (EOAs)
 * * ERC-1271 signatures from smart contract wallets like Argent and Safe Wallet (previously Gnosis Safe)
 * * ERC-7913 signatures from keys that do not have an Ethereum address of their own
 * * ERC-7964 crosschain signatures, where a single EIP-712 signature authorizes operations on multiple chains
 *
 * See https://eips.ethereum.org/EIPS/eip-1271[ERC-1271], https://eips.ethereum.org/EIPS/eip-7913[ERC-7913] and
 * https://eips.ethereum.org/EIPS/eip-7964[ERC-7964].
 */
library SignatureChecker {
    using Bytes for bytes;
    using Memory for *;

    /// @dev Prefix of the header word that identifies an ERC-7964 crosschain signature.
    bytes9 internal constant ERC7964_MAGIC = 0x796479647964796479;

    /**
     * @dev Checks if a signature is valid for a given signer and data hash. If the signer has code, the
     * signature is validated against it using ERC-1271, otherwise it's validated using `ECDSA.recover`.
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     *
     * NOTE: For an extended version of this function that supports ERC-7913 signatures, see {isValidSignatureNow-bytes-bytes32-bytes-}.
     */
    function isValidSignatureNow(address signer, bytes32 hash, bytes memory signature) internal view returns (bool) {
        if (signer.code.length == 0) {
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
            return err == ECDSA.RecoverError.NoError && recovered == signer;
        } else {
            return isValidERC1271SignatureNow(signer, hash, signature);
        }
    }

    /**
     * @dev Variant of {isValidSignatureNow} that takes a signature in calldata
     */
    function isValidSignatureNowCalldata(
        address signer,
        bytes32 hash,
        bytes calldata signature
    ) internal view returns (bool) {
        if (signer.code.length == 0) {
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecoverCalldata(hash, signature);
            return err == ECDSA.RecoverError.NoError && recovered == signer;
        } else {
            return isValidERC1271SignatureNowCalldata(signer, hash, signature);
        }
    }

    /**
     * @dev Checks if a signature is valid for a given signer and data hash. The signature is validated
     * against the signer smart contract using ERC-1271.
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     */
    function isValidERC1271SignatureNow(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool result) {
        bytes4 selector = IERC1271.isValidSignature.selector;
        uint256 length = signature.length;

        assembly ("memory-safe") {
            // Encoded calldata following https://docs.soliditylang.org/en/v0.8.35/abi-spec.html:
            // [ 0x00 - 0x03 ] <selector>
            // [ 0x04 - 0x23 ] <hash>
            // [ 0x24 - 0x43 ] <signature offset> (0x40)
            // [ 0x44 - 0x63 ] <signature length>
            // [ 0x64 - ...  ] <signature data> | <zero padding>
            let ptr := mload(0x40)
            mstore(ptr, selector)
            mstore(add(ptr, 0x04), hash)
            mstore(add(ptr, 0x24), 0x40)
            mcopy(add(ptr, 0x44), signature, add(length, 0x20))
            mstore(add(add(ptr, 0x64), length), 0)

            // round up the length to the next multiple of 32 bytes to ensure that the calldata is properly padded
            length := shl(5, shr(5, add(length, 0x1F)))

            let success := staticcall(gas(), signer, ptr, add(length, 0x64), 0x00, 0x20)
            result := and(success, and(gt(returndatasize(), 0x1f), eq(mload(0x00), selector)))
        }
    }

    function isValidERC1271SignatureNowCalldata(
        address signer,
        bytes32 hash,
        bytes calldata signature
    ) internal view returns (bool result) {
        bytes4 selector = IERC1271.isValidSignature.selector;
        uint256 length = signature.length;

        assembly ("memory-safe") {
            // Encoded calldata following https://docs.soliditylang.org/en/v0.8.35/abi-spec.html:
            // [ 0x00 - 0x03 ] <selector>
            // [ 0x04 - 0x23 ] <hash>
            // [ 0x24 - 0x43 ] <signature offset> (0x40)
            // [ 0x44 - 0x63 ] <signature length>
            // [ 0x64 - ...  ] <signature data> | <zero padding>
            let ptr := mload(0x40)
            mstore(ptr, selector)
            mstore(add(ptr, 0x04), hash)
            mstore(add(ptr, 0x24), 0x40)
            mstore(add(ptr, 0x44), length)
            calldatacopy(add(ptr, 0x64), signature.offset, length)
            mstore(add(add(ptr, 0x64), length), 0)

            // round up the length to the next multiple of 32 bytes to ensure that the calldata is properly padded
            length := shl(5, shr(5, add(length, 0x1F)))

            let success := staticcall(gas(), signer, ptr, add(length, 0x64), 0x00, 0x20)
            result := and(success, and(gt(returndatasize(), 0x1f), eq(mload(0x00), selector)))
        }
    }

    /**
     * @dev Verifies a signature for a given ERC-7913 signer and hash.
     *
     * The signer is a `bytes` object that is the concatenation of an address and optionally a key:
     * `verifier || key`. A signer must be at least 20 bytes long.
     *
     * Verification is done as follows:
     *
     * * If `signer.length < 20`: verification fails
     * * If `signer.length == 20`: verification is done using {isValidSignatureNow}
     * * Otherwise: verification is done using {IERC7913SignatureVerifier}
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     */
    function isValidSignatureNow(
        bytes memory signer,
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        if (signer.length < 20) {
            return false;
        } else if (signer.length == 20) {
            return isValidSignatureNow(address(bytes20(signer)), hash, signature);
        } else {
            (bool success, bytes memory result) = address(bytes20(signer)).staticcall(
                abi.encodeCall(IERC7913SignatureVerifier.verify, (signer.slice(20), hash, signature))
            );
            return (success &&
                result.length >= 32 &&
                abi.decode(result, (bytes32)) == bytes32(IERC7913SignatureVerifier.verify.selector));
        }
    }

    /**
     * @dev Verifies multiple ERC-7913 `signatures` for a given `hash` using a set of `signers`.
     * Returns `false` if the number of signers and signatures is not the same.
     *
     * The signers should be ordered by their `keccak256` hash to ensure efficient duplication check. Unordered
     * signers are supported, but the uniqueness check will be more expensive.
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     */
    function areValidSignaturesNow(
        bytes32 hash,
        bytes[] memory signers,
        bytes[] memory signatures
    ) internal view returns (bool) {
        if (signers.length != signatures.length) return false;

        bytes32 lastId = bytes32(0);

        for (uint256 i = 0; i < signers.length; ++i) {
            bytes memory signer = signers[i];

            // If one of the signatures is invalid, reject the batch
            if (!isValidSignatureNow(signer, hash, signatures[i])) return false;

            bytes32 id = keccak256(signer);
            // If the current signer ID is greater than all previous IDs, then this is a new signer.
            if (lastId < id) {
                lastId = id;
            } else {
                // If this signer id is not greater than all the previous ones, verify that it is not a duplicate of a previous one
                // This loop is never executed if the signers are ordered by id.
                for (uint256 j = 0; j < i; ++j) {
                    if (id == keccak256(signers[j])) return false;
                }
            }
        }

        return true;
    }

    /**
     * @dev Checks if an https://eips.ethereum.org/EIPS/eip-7964[ERC-7964] crosschain `signature` is valid for a given
     * `signer` and `hash`, where `hash` is the EIP-712 struct hash of the operation to execute on the current chain.
     *
     * Crosschain signatures are EIP-712 signatures over a message that contains an array with the struct hashes of the
     * operations for every chain, and a domain that omits the `chainId`. The `structHash` function computes the struct
     * hash of that message from the hash of the array (i.e. `keccak256(abi.encodePacked(structsArray))`), so that
     * applications can include other fields such as a nonce or a deadline.
     *
     * Verification is done as follows:
     *
     * 1. `signature` is parsed with {tryParseCrossChainSignature}. Verification fails if parsing fails or if
     *    `crossChainSignature` is empty.
     * 2. `structsArray[structIndex]` must be equal to `hash`. Verification fails otherwise.
     * 3. The EIP-712 domain is fetched from `application` using {IERC5267-eip712Domain}, and the domain separator is
     *    built with the `fields` from `signature`. Verification fails if `application` has no code, if the call reverts,
     *    or if `fields` sets any bit beyond the ones defined in ERC-5267. If `application` returns data that can't be
     *    decoded, this function reverts.
     * 4. `crossChainSignature` is verified with {isValidSignatureNow-address-bytes32-bytes-} against the EIP-712
     *    typed data hash of the domain separator and `structHash(keccak256(abi.encodePacked(structsArray)))`.
     *
     * IMPORTANT: The domain separator does not include the `chainId`, so `hash` is what binds the signature to the
     * current chain. Following ERC-7964, each operation struct must include the target `chainId` (and the verifying
     * contract address, unless the domain includes `verifyingContract`). The domain returned by `application` is
     * covered by the signature, so a different `application` can only be used if it returns the same signed domain.
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     */
    function isValidCrossChainSignatureNow(
        address signer,
        bytes32 hash,
        bytes memory signature,
        function(bytes32) internal view returns (bytes32) structHash
    ) internal view returns (bool) {
        (
            bytes1 fields,
            address application,
            bytes memory crossChainSignature,
            bytes32 structHash_
        ) = _tryParseCrossChainSignatureForValidation(hash, signature, structHash);
        if (structHash_ == bytes32(0)) return false;

        (bool success, bytes32 domainSeparator) = _tryFetchDomainSeparator(application, fields);
        return
            success &&
            isValidSignatureNow(
                signer,
                MessageHashUtils.toTypedDataHash(domainSeparator, structHash_),
                crossChainSignature
            );
    }

    /// @dev Variant of {isValidCrossChainSignatureNow} that takes a signature in calldata.
    function isValidCrossChainSignatureNowCalldata(
        address signer,
        bytes32 hash,
        bytes calldata signature,
        function(bytes32) internal view returns (bytes32) structHash
    ) internal view returns (bool) {
        (
            bytes1 fields,
            address application,
            bytes calldata crossChainSignature,
            bytes32 structHash_
        ) = _tryParseCrossChainSignatureForValidationCalldata(hash, signature, structHash);
        if (structHash_ == bytes32(0)) return false;

        (bool success, bytes32 domainSeparator) = _tryFetchDomainSeparator(application, fields);
        return
            success &&
            isValidSignatureNowCalldata(
                signer,
                MessageHashUtils.toTypedDataHash(domainSeparator, structHash_),
                crossChainSignature
            );
    }

    /**
     * @dev Parses an https://eips.ethereum.org/EIPS/eip-7964[ERC-7964] crosschain signature, encoded as
     * `abi.encode(bytes32 header, bytes32[] structsArray, bytes crossChainSignature)`, where `header` is
     * `abi.encodePacked(ERC7964_MAGIC, fields, structIndex, application)`. Returns:
     *
     * * `fields`: The ERC-5267 fields of the EIP-712 domain that was signed.
     * * `structIndex`: The index in `structsArray` of the operation for the current chain.
     * * `application`: The address of the ERC-5267 contract that provides the EIP-712 domain.
     * * `structsArray`: The struct hashes of the operations for every chain.
     * * `crossChainSignature`: The signature of the EIP-712 message.
     *
     * If `signature` doesn't start with {ERC7964_MAGIC}, or if the offsets of `structsArray` and `crossChainSignature`
     * don't point after the head (in that order) or the data is not fully contained in `signature`, parsing fails and
     * all the return values are empty.
     *
     * NOTE: To avoid copying, `structsArray` and `crossChainSignature` point to the memory of `signature`. Modifying any
     * of them also modifies `signature`.
     */
    function tryParseCrossChainSignature(
        bytes memory signature
    )
        internal
        pure
        returns (
            bytes1 fields,
            uint16 structIndex,
            address application,
            bytes32[] memory structsArray,
            bytes memory crossChainSignature
        )
    {
        Memory.Slice signatureSlice = signature.asSlice();
        // magic (9 bytes) + fields (1 byte) + structIndex (2 bytes) + application (20 bytes) + structsArrayOffset (32 bytes) +
        // crossChainSignatureOffset (32 bytes) + structsArrayLength (32 bytes) + crossChainSignatureLength (32 bytes)
        uint256 length = signature.length;
        if (length < 0xa0 || bytes9(signatureSlice.load(0)) != ERC7964_MAGIC) {
            return (0, 0, address(0), new bytes32[](0), new bytes(0));
        }
        fields = bytes1(signatureSlice.load(9));
        structIndex = uint16(bytes2(signatureSlice.load(10)));
        application = address(bytes20(signatureSlice.load(12)));

        // Each bound is checked before it is used, so no operation overflows and all reads are within `signature`
        uint256 structsArrayOffset = uint256(signatureSlice.load(0x20));
        if (structsArrayOffset < 0x60 || structsArrayOffset > length - 0x20) {
            return (0, 0, address(0), new bytes32[](0), new bytes(0));
        }
        uint256 structsArrayLength = uint256(signatureSlice.load(structsArrayOffset));
        if (structsArrayLength > (length - structsArrayOffset - 0x20) / 0x20) {
            return (0, 0, address(0), new bytes32[](0), new bytes(0));
        }
        uint256 crossChainSignatureOffset = uint256(signatureSlice.load(0x40));
        if (
            crossChainSignatureOffset < structsArrayOffset + 0x20 + structsArrayLength * 0x20 ||
            crossChainSignatureOffset > length - 0x20
        ) {
            return (0, 0, address(0), new bytes32[](0), new bytes(0));
        }
        uint256 crossChainSignatureLength = uint256(signatureSlice.load(crossChainSignatureOffset));
        if (crossChainSignatureLength > length - crossChainSignatureOffset - 0x20) {
            return (0, 0, address(0), new bytes32[](0), new bytes(0));
        }

        assembly ("memory-safe") {
            structsArray := add(add(signature, 0x20), structsArrayOffset)
            crossChainSignature := add(add(signature, 0x20), crossChainSignatureOffset)
        }
    }

    /// @dev Variant of {tryParseCrossChainSignature} that takes a signature in calldata.
    function tryParseCrossChainSignatureCalldata(
        bytes calldata signature
    )
        internal
        pure
        returns (
            bytes1 fields,
            uint16 structIndex,
            address application,
            bytes32[] calldata structsArray,
            bytes calldata crossChainSignature
        )
    {
        // magic (9 bytes) + fields (1 byte) + structIndex (2 bytes) + application (20 bytes) + structsArrayOffset (32 bytes) +
        // crossChainSignatureOffset (32 bytes) + structsArrayLength (32 bytes) + crossChainSignatureLength (32 bytes)
        uint256 length = signature.length;
        if (length < 0xa0 || bytes9(signature[0:9]) != ERC7964_MAGIC) {
            return (0, 0, address(0), _emptyBytes32ArrayCalldata(), Calldata.emptyBytes());
        }
        fields = signature[9];
        structIndex = uint16(bytes2(signature[10:12]));
        application = address(bytes20(signature[12:32]));

        // Each bound is checked before it is used, so no operation overflows and all reads are within `signature`
        uint256 structsArrayOffset = uint256(bytes32(signature[0x20:0x40]));
        if (structsArrayOffset < 0x60 || structsArrayOffset > length - 0x20) {
            return (0, 0, address(0), _emptyBytes32ArrayCalldata(), Calldata.emptyBytes());
        }
        uint256 structsArrayLength = uint256(bytes32(signature[structsArrayOffset:]));
        if (structsArrayLength > (length - structsArrayOffset - 0x20) / 0x20) {
            return (0, 0, address(0), _emptyBytes32ArrayCalldata(), Calldata.emptyBytes());
        }
        uint256 crossChainSignatureOffset = uint256(bytes32(signature[0x40:0x60]));
        if (
            crossChainSignatureOffset < structsArrayOffset + 0x20 + structsArrayLength * 0x20 ||
            crossChainSignatureOffset > length - 0x20
        ) {
            return (0, 0, address(0), _emptyBytes32ArrayCalldata(), Calldata.emptyBytes());
        }
        uint256 crossChainSignatureLength = uint256(bytes32(signature[crossChainSignatureOffset:]));
        if (crossChainSignatureLength > length - crossChainSignatureOffset - 0x20) {
            return (0, 0, address(0), _emptyBytes32ArrayCalldata(), Calldata.emptyBytes());
        }

        assembly ("memory-safe") {
            structsArray.offset := add(signature.offset, add(structsArrayOffset, 0x20))
            structsArray.length := structsArrayLength
        }
        crossChainSignature = signature[
            crossChainSignatureOffset + 0x20:crossChainSignatureOffset + 0x20 + crossChainSignatureLength
        ];
    }

    function _tryParseCrossChainSignatureForValidation(
        bytes32 hash,
        bytes memory signature,
        function(bytes32) internal view returns (bytes32) structHash
    ) private view returns (bytes1 fields, address application, bytes memory crossChainSignature, bytes32 structHash_) {
        uint16 structIndex;
        bytes32[] memory structsArray;
        (fields, structIndex, application, structsArray, crossChainSignature) = tryParseCrossChainSignature(signature);
        if (crossChainSignature.length == 0 || structIndex >= structsArray.length || structsArray[structIndex] != hash)
            return (0, address(0), new bytes(0), 0);
        structHash_ = structHash(keccak256(abi.encodePacked(structsArray)));
    }

    function _tryParseCrossChainSignatureForValidationCalldata(
        bytes32 hash,
        bytes calldata signature,
        function(bytes32) internal view returns (bytes32) structHash
    )
        private
        view
        returns (bytes1 fields, address application, bytes calldata crossChainSignature, bytes32 structHash_)
    {
        uint16 structIndex;
        bytes32[] calldata structsArray;
        (fields, structIndex, application, structsArray, crossChainSignature) = tryParseCrossChainSignatureCalldata(
            signature
        );
        if (crossChainSignature.length == 0 || structIndex >= structsArray.length || structsArray[structIndex] != hash)
            return (0, address(0), Calldata.emptyBytes(), 0);
        structHash_ = structHash(keccak256(abi.encodePacked(structsArray)));
    }

    /**
     * @dev Builds the EIP-712 domain separator for the `fields` of the domain returned by `application`. Returns false
     * if `fields` sets any bit beyond the ones defined in ERC-5267, if `application` has no code, or if the call to
     * {IERC5267-eip712Domain} reverts.
     */
    function _tryFetchDomainSeparator(address application, bytes1 fields) private view returns (bool, bytes32) {
        if (uint8(fields) > 0x1f || application.code.length == 0) return (false, 0);
        try IERC5267(application).eip712Domain() returns (
            bytes1,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory
        ) {
            return (true, MessageHashUtils.toDomainSeparator(fields, name, version, chainId, verifyingContract, salt));
        } catch {
            return (false, 0);
        }
    }

    // slither-disable-next-line write-after-write
    function _emptyBytes32ArrayCalldata() private pure returns (bytes32[] calldata result) {
        assembly ("memory-safe") {
            result.offset := 0
            result.length := 0
        }
    }
}
