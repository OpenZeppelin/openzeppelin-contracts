// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Math} from "../../math/Math.sol";
import {MultiSignerERC7913} from "./MultiSignerERC7913.sol";
import {EnumerableSet} from "../../../utils/structs/EnumerableSet.sol";

/**
 * @dev Extension of {MultiSignerERC7913} that supports weighted signatures.
 *
 * This contract allows assigning different weights to each signer, enabling more
 * flexible governance schemes. For example, some signers could have higher weight
 * than others, allowing for weighted voting or prioritized authorization.
 *
 * Example of usage:
 *
 * ```solidity
 * contract MyWeightedMultiSignerAccount is Account, MultiSignerERC7913Weighted, Initializable {
 *     constructor() EIP712("MyWeightedMultiSignerAccount", "1") {}
 *
 *     function initialize(bytes[] memory signers, uint64[] memory weights, uint64 threshold) public initializer {
 *         _addSigners(signers);
 *         _setSignerWeights(signers, weights);
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
 *     function setThreshold(uint64 threshold) public onlyEntryPointOrSelf {
 *         _setThreshold(threshold);
 *     }
 *
 *     function setSignerWeights(bytes[] memory signers, uint64[] memory weights) public onlyEntryPointOrSelf {
 *         _setSignerWeights(signers, weights);
 *     }
 * }
 * ```
 *
 * IMPORTANT: When setting a threshold value, ensure it matches the scale used for signer weights.
 * For example, if signers have weights like 1, 2, or 3, then a threshold of 4 would require at
 * least two signers (e.g., one with weight 1 and one with weight 3). See {signerWeight}.
 */
abstract contract MultiSignerERC7913Weighted is MultiSignerERC7913 {
    using EnumerableSet for EnumerableSet.BytesSet;

    // Mapping from signer to weight
    mapping(bytes signer => uint64) private _weights;

    /**
     * @dev Emitted when a signer's weight is changed.
     *
     * NOTE: Not emitted in {_addSigners}. Indexers must rely on {ERC7913SignerAdded} to index a
     * default weight of 1. See {_signerWeight}.
     */
    event ERC7913SignerWeightChanged(bytes indexed signer, uint64 weight);

    /// @dev Thrown when a signer's weight is invalid.
    error MultiSignerERC7913WeightedInvalidWeight(bytes signer, uint64 weight);

    /// @dev Thrown when the threshold is unreachable.
    error MultiSignerERC7913WeightedMismatchedLength();

    /// @dev Gets the weight of a signer. Returns 0 if the signer is not authorized.
    function signerWeight(bytes memory signer) public view virtual returns (uint64) {
        return uint64(Math.ternary(isSigner(signer), _signerWeight(signer), 0)); // Safe cast, both uint64
    }

    /// @dev Gets the total weight of all signers.
    function totalWeight() public view virtual returns (uint64) {
        return _weightSigners(getSigners(0, type(uint64).max));
    }

    /**
     * @dev Gets the weight of the current signer. Returns 1 if not explicitly set.
     *
     * NOTE: This internal function doesn't check if the signer is authorized.
     */
    function _signerWeight(bytes memory signer) internal view virtual returns (uint64) {
        return uint64(Math.max(_weights[signer], 1)); // Safe cast, both uint64
    }

    /**
     * @dev Sets weights for multiple signers at once. Internal version without access control.
     *
     * Requirements:
     *
     * - `signers` and `weights` arrays must have the same length. Reverts with {MultiSignerERC7913WeightedMismatchedLength} on mismatch.
     * - Each signer must exist in the set of authorized signers. Reverts with {MultiSignerERC7913NonexistentSigner} if not.
     * - Each weight must be greater than 0. Reverts with {MultiSignerERC7913WeightedInvalidWeight} if not.
     * - See {_validateReachableThreshold} for the threshold validation.
     *
     * Emits {ERC7913SignerWeightChanged} for each signer.
     */
    function _setSignerWeights(bytes[] memory signers, uint64[] memory newWeights) internal virtual {
        require(signers.length == newWeights.length, MultiSignerERC7913WeightedMismatchedLength());

        for (uint256 i = 0; i < signers.length; ++i) {
            bytes memory signer = signers[i];
            uint64 newWeight = newWeights[i];
            require(isSigner(signer), MultiSignerERC7913NonexistentSigner(signer));
            require(newWeight > 0, MultiSignerERC7913WeightedInvalidWeight(signer, newWeight));
        }

        _unsafeSetSignerWeights(signers, newWeights);
        _validateReachableThreshold();
    }

    /**
     * @dev See {MultiSignerERC7913-_removeSigners}.
     *
     * Emits {ERC7913SignerWeightChanged} for each removed signer.
     */
    function _removeSigners(bytes[] memory oldSigners) internal virtual override {
        // Clean up weights for removed signers
        _unsafeSetSignerWeights(oldSigners, new uint64[](oldSigners.length));
        super._removeSigners(oldSigners);
    }

    /**
     * @dev Sets the threshold for the multisignature operation. Internal version without access control.
     *
     * Requirements:
     *
     * * The {totalWeight} must be `>=` to the {threshold}. Throws {MultiSignerERC7913UnreachableThreshold} if not.
     *
     * NOTE: This function intentionally does not call `super._validateReachableThreshold` because the base implementation
     * assumes each signer has a weight of 1, which is a subset of this weighted implementation. Consider that multiple
     * implementations of this function may exist in the contract, so important side effects may be missed
     * depending on the linearization order.
     */
    function _validateReachableThreshold() internal view virtual override {
        uint64 weight = totalWeight();
        uint64 currentThreshold = threshold();
        require(weight >= currentThreshold, MultiSignerERC7913UnreachableThreshold(weight, currentThreshold));
    }

    /**
     * @dev Validates that the total weight of signers meets the threshold requirement.
     *
     * NOTE: This function intentionally does not call `super._validateThreshold` because the base implementation
     * assumes each signer has a weight of 1, which is a subset of this weighted implementation. Consider that multiple
     * implementations of this function may exist in the contract, so important side effects may be missed
     * depending on the linearization order.
     */
    function _validateThreshold(bytes[] memory signers) internal view virtual override returns (bool) {
        return _weightSigners(signers) >= threshold();
    }

    /// @dev Calculates the total weight of a set of signers. For all signers weight use {totalWeight}.
    function _weightSigners(bytes[] memory signers) internal view virtual returns (uint64) {
        uint64 weight = 0;
        for (uint256 i = 0; i < signers.length; ++i) {
            weight += signerWeight(signers[i]);
        }
        return weight;
    }

    /**
     * @dev Sets the weights for multiple signers without updating the total weight or validating the threshold.
     *
     * Requirements:
     *
     * * The `newWeights` array must be at least as large as the `signers` array. Panics otherwise.
     *
     * Emits {ERC7913SignerWeightChanged} for each signer.
     */
    function _unsafeSetSignerWeights(bytes[] memory signers, uint64[] memory newWeights) private {
        for (uint256 i = 0; i < signers.length; ++i) {
            _weights[signers[i]] = newWeights[i];
            emit ERC7913SignerWeightChanged(signers[i], newWeights[i]);
        }
    }
}
