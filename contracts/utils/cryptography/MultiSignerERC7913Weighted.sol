// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Math} from "../math/Math.sol";
import {SafeCast} from "../math/SafeCast.sol";
import {MultiSignerERC7913} from "./MultiSignerERC7913.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";

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
 *     function initialize(bytes[] memory signers, uint256[] memory weights, uint256 threshold) public initializer {
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
 *     function setThreshold(uint256 threshold) public onlyEntryPointOrSelf {
 *         _setThreshold(threshold);
 *     }
 *
 *     function setSignerWeights(bytes[] memory signers, uint256[] memory weights) public onlyEntryPointOrSelf {
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
    using SafeCast for uint256;

    // Invariant: sum(weights) >= threshold
    uint128 private _totalWeight;

    // Mapping from signer to weight
    mapping(bytes signer => uint256) private _weights;

    /// @dev Emitted when a signer's weight is changed.
    event ERC7913SignerWeightChanged(bytes indexed signer, uint256 weight);

    /// @dev Thrown when a signer's weight is invalid.
    error MultiSignerERC7913WeightedInvalidWeight(bytes signer, uint256 weight);

    /// @dev Thrown when the threshold is unreachable.
    error MultiSignerERC7913WeightedMismatchedLength();

    /// @dev Gets the weight of a signer. Returns 0 if the signer is not authorized.
    function signerWeight(bytes memory signer) public view virtual returns (uint256) {
        return Math.ternary(isSigner(signer), _signerWeight(signer), 0);
    }

    /// @dev Gets the total weight of all signers.
    function totalWeight() public view virtual returns (uint256) {
        return _totalWeight; // Doesn't need Math.max because it's incremented by the default 1 in `_addSigners`
    }

    /**
     * @dev Gets the weight of the current signer. Returns 1 if not explicitly set.
     *
     * NOTE: This internal function doesn't check if the signer is authorized.
     */
    function _signerWeight(bytes memory signer) internal view virtual returns (uint256) {
        return Math.max(_weights[signer], 1);
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
    function _setSignerWeights(bytes[] memory signers, uint256[] memory newWeights) internal virtual {
        require(signers.length == newWeights.length, MultiSignerERC7913WeightedMismatchedLength());
        uint256 oldWeight = _weightSigners(signers);
        uint256 signersLength = signers.length;

        for (uint256 i = 0; i < signersLength; i++) {
            bytes memory signer = signers[i];
            uint256 newWeight = newWeights[i];
            require(isSigner(signer), MultiSignerERC7913NonexistentSigner(signer));
            require(newWeight > 0, MultiSignerERC7913WeightedInvalidWeight(signer, newWeight));
        }

        _unsafeSetSignerWeights(signers, newWeights);
        _totalWeight = (_totalWeight - oldWeight + _weightSigners(signers)).toUint128();
        _validateReachableThreshold();
    }

    /// @inheritdoc MultiSignerERC7913
    function _addSigners(bytes[] memory newSigners) internal virtual override {
        super._addSigners(newSigners);
        _totalWeight += newSigners.length.toUint128(); // Each new signer has a default weight of 1
    }

    /**
     * @dev See {MultiSignerERC7913-_removeSigners}.
     *
     * Emits {ERC7913SignerWeightChanged} for each removed signer.
     */
    function _removeSigners(bytes[] memory oldSigners) internal virtual override {
        uint256 removedWeight = _weightSigners(oldSigners);
        unchecked {
            // Can't overflow. Invariant: sum(weights) >= threshold
            _totalWeight -= removedWeight.toUint128();
        }
        // Clean up weights for removed signers
        _unsafeSetSignerWeights(oldSigners, new uint256[](oldSigners.length));
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
        uint256 weight = totalWeight();
        uint256 currentThreshold = threshold();
        require(weight >= currentThreshold, MultiSignerERC7913UnreachableThreshold(weight, currentThreshold));
    }

    /**
     * @dev Validates that the total weight of signers meets the threshold requirement.
     *
     * NOTE: This function intentionally does not call `super. _validateThreshold` because the base implementation
     * assumes each signer has a weight of 1, which is a subset of this weighted implementation. Consider that multiple
     * implementations of this function may exist in the contract, so important side effects may be missed
     * depending on the linearization order.
     */
    function _validateThreshold(bytes[] memory signers) internal view virtual override returns (bool) {
        return _weightSigners(signers) >= threshold();
    }

    /// @dev Calculates the total weight of a set of signers. For all signers weight use {totalWeight}.
    function _weightSigners(bytes[] memory signers) internal view virtual returns (uint256) {
        uint256 weight = 0;
        uint256 signersLength = signers.length;
        for (uint256 i = 0; i < signersLength; i++) {
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
    function _unsafeSetSignerWeights(bytes[] memory signers, uint256[] memory newWeights) private {
        uint256 signersLength = signers.length;
        for (uint256 i = 0; i < signersLength; i++) {
            _weights[signers[i]] = newWeights[i];
            emit ERC7913SignerWeightChanged(signers[i], newWeights[i]);
        }
    }
}
