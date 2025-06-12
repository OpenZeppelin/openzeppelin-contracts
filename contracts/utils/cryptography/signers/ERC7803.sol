// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AbstractSigner} from "./AbstractSigner.sol";
import {EIP712} from "../EIP712.sol";
import {ERC7803Utils} from "../ERC7803Utils.sol";
import {IERC1271} from "../../../interfaces/IERC1271.sol";
import {MessageHashUtils} from "../MessageHashUtils.sol";

/**
 * @dev Validates signatures using ERC-7803 signing domains for Account Abstraction.
 *
 * This contract implements the ERC-7803 specification which provides improvements for EIP-712 signatures
 * to better support smart contract accounts by:
 *
 * 1. Introducing signing domains to prevent replay attacks when private keys are shared across accounts
 * 2. Allowing dapps and wallets to coordinate on authentication methods
 *
 * The recursive encoding scheme prevents signature replay across different account hierarchies while
 * maintaining compatibility with existing EIP-712 infrastructure.
 *
 * NOTE: xref:api:utils/cryptography#EIP712[EIP-712] uses xref:api:utils/cryptography#ShortStrings[ShortStrings] to
 * optimize gas costs for short strings (up to 31 characters). Consider that strings longer than that will use storage,
 * which may limit the ability of the signer to be used within the ERC-4337 validation phase (due to
 * https://eips.ethereum.org/EIPS/eip-7562#storage-rules[ERC-7562 storage access rules]).
 */
abstract contract ERC7803 is AbstractSigner, EIP712, IERC1271 {
    using ERC7803Utils for *;
    using MessageHashUtils for bytes32;

    /**
     * @dev Attempts validating the signature using ERC-7803 signing domains and authentication methods.
     *
     * The validation process follows these steps:
     *
     * 1. Try validation with signing domains if provided
     * 2. Fall back to standard EIP-712 validation
     * 3. Apply authentication methods in the specified order
     */
    function isValidSignature(bytes32 hash, bytes calldata signature) public view virtual returns (bytes4 result) {
        // For the hash `0x7803780378037803780378037803780378037803780378037803780378037803` and an empty signature,
        // we return the magic value `0x78030001` as it's assumed impossible to find a preimage for it that can be used
        // maliciously. Useful for simulation purposes and to validate whether the contract supports ERC-7803.
        return
            (_isValidERC7803Signature(hash, signature) || _rawSignatureValidation(hash, signature))
                ? IERC1271.isValidSignature.selector
                : (hash == 0x7803780378037803780378037803780378037803780378037803780378037803 && signature.length == 0)
                    ? bytes4(0x78030001)
                    : bytes4(0xffffffff);
    }

    /**
     * @dev Validates signature using ERC-7803 signing domains.
     * This function decodes the signature to extract signing domain information and validates accordingly.
     *
     * The signature is encoded as: `abi.encodePacked(uint16(bytesLength),bytes,abi.encode(bytes32[]))`
     */
    function _isValidERC7803Signature(bytes32 hash, bytes calldata signature) internal view returns (bool) {
        uint16 bytesLength = uint16(bytes2(signature[0:2]));
        bytes calldata actualSignature = signature[2:bytesLength + 2];
        bytes calldata encodedData = signature[bytesLength + 2:];

        return
            encodedData.length > 0 &&
            _rawSignatureValidation(
                abi.decode(encodedData, (bytes32[])).encodeForSigningDomains(_domainSeparatorV4(), hash),
                actualSignature
            );
    }
}
