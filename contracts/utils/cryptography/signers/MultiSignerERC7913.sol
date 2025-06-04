// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {AbstractSigner} from "./AbstractSigner.sol";
import {SignatureChecker} from "../SignatureChecker.sol";
import {EnumerableSet} from "../../structs/EnumerableSet.sol";
import {SafeCast} from "../../../utils/math/SafeCast.sol";

/**
 * @dev Implementation of {AbstractSigner} using multiple ERC-7913 signers with a threshold-based
 * signature verification system.
 *
 * This contract allows managing a set of authorized signers and requires a minimum number of
 * signatures (threshold) to approve operations. It uses ERC-7913 formatted signers, which
 * concatenate a verifier address and a key: `verifier || key`.
 *
 * Example of usage:
 *
 * ```solidity
 * contract MyMultiSignerAccount is Account, MultiSignerERC7913, Initializable {
 *     constructor() EIP712("MyMultiSignerAccount", "1") {}
 *
 *     function initialize(bytes[] memory signers, uint256 threshold) public initializer {
 *         _addSigners(signers);
 *         _setThreshold(threshold);
 *     }
 *
 *     function addSigners(bytes[] memory signers) public onlyEntryPointOrSelf {
 *         _addSigners(signers);
 *     }
 *
 *     function removeSigners(bytes[] memory signers) public onlyEntryPointOrSelf {
 *         _removeSigners(signers);
 *     }
 *
 *     function setThreshold(uint256 threshold) public onlyEntryPointOrSelf {
 *         _setThreshold(threshold);
 *     }
 * }
 * ```
 *
 * IMPORTANT: Failing to properly initialize the signers and threshold either during construction
 * (if used standalone) or during initialization (if used as a clone) may leave the contract
 * either front-runnable or unusable.
 */
abstract contract MultiSignerERC7913 is AbstractSigner {
    using EnumerableSet for EnumerableSet.BytesSet;
    using SignatureChecker for *;
    using SafeCast for uint256;

    EnumerableSet.BytesSet private _signers;
    uint128 private _threshold;

    /// @dev Emitted when a signer is added.
    event ERC7913SignerAdded(bytes indexed signers);

    /// @dev Emitted when a signers is removed.
    event ERC7913SignerRemoved(bytes indexed signers);

    /// @dev Emitted when the threshold is updated.
    event ERC7913ThresholdSet(uint256 threshold);

    /// @dev The `signer` already exists.
    error MultiSignerERC7913AlreadyExists(bytes signer);

    /// @dev The `signer` does not exist.
    error MultiSignerERC7913NonexistentSigner(bytes signer);

    /// @dev The `signer` is less than 20 bytes long.
    error MultiSignerERC7913InvalidSigner(bytes signer);

    /// @dev The `threshold` is unreachable given the number of `signers`.
    error MultiSignerERC7913UnreachableThreshold(uint256 signers, uint256 threshold);

    /**
     * @dev Returns the set of authorized signers. Prefer {_signers} for internal use.
     *
     * WARNING: This operation copies the entire signers set to memory, which can be expensive. This is designed
     * for view accessors queried without gas fees. Using it in state-changing functions may become uncallable
     * if the signers set grows too large.
     */
    function signers() public view virtual returns (bytes[] memory) {
        return _signers.values();
    }

    /// @dev Returns whether the `signer` is an authorized signer.
    function isSigner(bytes memory signer) public view virtual returns (bool) {
        return _signers.contains(signer);
    }

    /// @dev Returns the minimum number of signers required to approve a multisignature operation.
    function threshold() public view virtual returns (uint256) {
        return _threshold;
    }

    /**
     * @dev Adds the `newSigners` to those allowed to sign on behalf of this contract.
     * Internal version without access control.
     *
     * Requirements:
     *
     * * Each of `newSigners` must be at least 20 bytes long. Reverts with {MultiSignerERC7913InvalidSigner} if not.
     * * Each of `newSigners` must not be authorized. See {isSigner}. Reverts with {MultiSignerERC7913AlreadyExists} if so.
     */
    function _addSigners(bytes[] memory newSigners) internal virtual {
        for (uint256 i = 0; i < newSigners.length; ++i) {
            bytes memory signer = newSigners[i];
            require(signer.length >= 20, MultiSignerERC7913InvalidSigner(signer));
            require(_signers.add(signer), MultiSignerERC7913AlreadyExists(signer));
            emit ERC7913SignerAdded(signer);
        }
    }

    /**
     * @dev Removes the `oldSigners` from the authorized signers. Internal version without access control.
     *
     * Requirements:
     *
     * * Each of `oldSigners` must be authorized. See {isSigner}. Otherwise {MultiSignerERC7913NonexistentSigner} is thrown.
     * * See {_validateReachableThreshold} for the threshold validation.
     */
    function _removeSigners(bytes[] memory oldSigners) internal virtual {
        for (uint256 i = 0; i < oldSigners.length; ++i) {
            bytes memory signer = oldSigners[i];
            require(_signers.remove(signer), MultiSignerERC7913NonexistentSigner(signer));
            emit ERC7913SignerRemoved(signer);
        }
        _validateReachableThreshold();
    }

    /**
     * @dev Sets the signatures `threshold` required to approve a multisignature operation.
     * Internal version without access control.
     *
     * Requirements:
     *
     * * See {_validateReachableThreshold} for the threshold validation.
     */
    function _setThreshold(uint256 newThreshold) internal virtual {
        _threshold = newThreshold.toUint128();
        _validateReachableThreshold();
        emit ERC7913ThresholdSet(newThreshold);
    }

    /**
     * @dev Validates the current threshold is reachable.
     *
     * Requirements:
     *
     * * The {signers}'s length must be `>=` to the {threshold}. Throws {MultiSignerERC7913UnreachableThreshold} if not.
     */
    function _validateReachableThreshold() internal view virtual {
        uint256 totalSigners = _signers.length();
        uint256 currentThreshold = threshold();
        require(
            totalSigners >= currentThreshold,
            MultiSignerERC7913UnreachableThreshold(totalSigners, currentThreshold)
        );
    }

    /**
     * @dev Decodes, validates the signature and checks the signers are authorized.
     * See {_validateSignatures} and {_validateThreshold} for more details.
     *
     * Example of signature encoding:
     *
     * ```solidity
     * // Encode signers (verifier || key)
     * bytes memory signer1 = abi.encodePacked(verifier1, key1);
     * bytes memory signer2 = abi.encodePacked(verifier2, key2);
     *
     * // Order signers by their id
     * if (keccak256(signer1) > keccak256(signer2)) {
     *     (signer1, signer2) = (signer2, signer1);
     *     (signature1, signature2) = (signature2, signature1);
     * }
     *
     * // Assign ordered signers and signatures
     * bytes[] memory signers = new bytes[](2);
     * bytes[] memory signatures = new bytes[](2);
     * signers[0] = signer1;
     * signatures[0] = signature1;
     * signers[1] = signer2;
     * signatures[1] = signature2;
     *
     * // Encode the multi signature
     * bytes memory signature = abi.encode(signers, signatures);
     * ```
     *
     * Requirements:
     *
     * * The `signature` must be encoded as `abi.encode(signers, signatures)`.
     */
    function _rawSignatureValidation(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        if (signature.length == 0) return false; // For ERC-7739 compatibility
        (bytes[] memory signingSigners, bytes[] memory signatures) = abi.decode(signature, (bytes[], bytes[]));
        return _validateThreshold(signingSigners) && _validateSignatures(hash, signingSigners, signatures);
    }

    /**
     * @dev Validates the signatures using the signers and their corresponding signatures.
     * Returns whether whether the signers are authorized and the signatures are valid for the given hash.
     *
     * IMPORTANT: For simplicity, this contract assumes that the signers are ordered by their `keccak256` hash
     * to avoid duplication when iterating through the signers (i.e. `keccak256(signer1) < keccak256(signer2)`).
     * The function will return false if the signers are not ordered.
     *
     * Requirements:
     *
     * * The `signatures` arrays must be at least as large as the `signingSigners` arrays. Panics otherwise.
     */
    function _validateSignatures(
        bytes32 hash,
        bytes[] memory signingSigners,
        bytes[] memory signatures
    ) internal view virtual returns (bool valid) {
        for (uint256 i = 0; i < signingSigners.length; ++i) {
            if (!isSigner(signingSigners[i])) {
                return false;
            }
        }
        return hash.areValidERC7913SignaturesNow(signingSigners, signatures);
    }

    /**
     * @dev Validates that the number of signers meets the {threshold} requirement.
     * Assumes the signers were already validated. See {_validateSignatures} for more details.
     */
    function _validateThreshold(bytes[] memory validatingSigners) internal view virtual returns (bool) {
        return validatingSigners.length >= threshold();
    }
}
