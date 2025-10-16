// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {SafeCast} from "../../utils/math/SafeCast.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";
import {ERC7579Multisig} from "./ERC7579Multisig.sol";

/**
 * @dev Extension of {ERC7579Multisig} that supports weighted signatures.
 *
 * This module extends the multisignature module to allow assigning different weights
 * to each signer, enabling more flexible governance schemes. For example, some guardians
 * could have higher weight than others, allowing for weighted voting or prioritized authorization.
 *
 * Example use case:
 *
 * A smart account with this module installed can schedule social recovery operations
 * after obtaining approval from guardians with sufficient total weight (e.g., requiring
 * a total weight of 10, with 3 guardians weighted as 5, 3, and 2), and then execute them
 * after the time delay has passed.
 *
 * IMPORTANT: When setting a threshold value, ensure it matches the scale used for signer weights.
 * For example, if signers have weights like 1, 2, or 3, then a threshold of 4 would require
 * signatures with a total weight of at least 4 (e.g., one with weight 1 and one with weight 3).
 */
abstract contract ERC7579MultisigWeighted is ERC7579Multisig {
    using EnumerableSet for EnumerableSet.BytesSet;
    using SafeCast for *;

    // Sum of all the extra weights of all signers. Each signer has a base weight of 1.
    mapping(address account => uint64 totalExtraWeight) private _totalExtraWeight;

    // Mapping from account => signer => extraWeight (in addition to all authorized signers having weight 1)
    mapping(address account => mapping(bytes signer => uint64)) private _extraWeights;

    /**
     * @dev Emitted when a signer's weight is changed.
     *
     * NOTE: Not emitted in {_addSigners} or {_removeSigners}. Indexers must rely on {ERC7913SignerAdded}
     * and {ERC7913SignerRemoved} to index a default weight of 1. See {signerWeight}.
     */
    event ERC7579MultisigWeightChanged(address indexed account, bytes indexed signer, uint64 weight);

    /// @dev Thrown when a signer's weight is invalid.
    error ERC7579MultisigInvalidWeight(bytes signer, uint64 weight);

    /// @dev Thrown when the arrays lengths don't match.
    error ERC7579MultisigMismatchedLength();

    /**
     * @dev Sets up the module's initial configuration when installed by an account.
     * Besides the standard delay and signer configuration, this can also include
     * signer weights.
     *
     * The initData should be encoded as:
     * `abi.encode(bytes[] signers, uint64 threshold, uint64[] weights)`
     *
     * If weights are not provided but signers are, all signers default to weight 1.
     *
     * NOTE: An account can only call onInstall once. If called directly by the account,
     * the signer will be set to the provided data. Future installations will behave as a no-op.
     */
    function onInstall(bytes calldata initData) public virtual override {
        bool installed = getSignerCount(msg.sender) > 0;
        super.onInstall(initData);
        if (initData.length > 96 && !installed) {
            (bytes[] calldata signers, , uint64[] calldata weights) = _decodeMultisigWeightedInitData(initData);
            _setSignerWeights(msg.sender, signers, weights);
        }
    }

    /**
     * @dev Cleans up module's configuration when uninstalled from an account.
     * Clears all signers, weights, and total weights.
     *
     * See {ERC7579Multisig-onUninstall}.
     */
    function onUninstall(bytes calldata data) public virtual override {
        address account = msg.sender;

        bytes[] memory allSigners = getSigners(account, 0, type(uint64).max);
        uint256 allSignersLength = allSigners.length;
        for (uint256 i = 0; i < allSignersLength; ++i) {
            delete _extraWeights[account][allSigners[i]];
        }
        delete _totalExtraWeight[account];

        // Call parent implementation which will clear signers and threshold
        super.onUninstall(data);
    }

    /// @dev Gets the weight of a signer for a specific account. Returns 0 if the signer is not authorized.
    function signerWeight(address account, bytes memory signer) public view virtual returns (uint64) {
        unchecked {
            // Safe cast, _setSignerWeights guarantees 1+_extraWeights is a uint64
            return uint64(isSigner(account, signer).toUint() * (1 + _extraWeights[account][signer]));
        }
    }

    /// @dev Gets the total weight of all signers for a specific account.
    function totalWeight(address account) public view virtual returns (uint64) {
        return (getSignerCount(account) + _totalExtraWeight[account]).toUint64();
    }

    /**
     * @dev Sets weights for signers for the calling account.
     * Can only be called by the account itself.
     */
    function setSignerWeights(bytes[] memory signers, uint64[] memory weights) public virtual {
        _setSignerWeights(msg.sender, signers, weights);
    }

    function _decodeMultisigWeightedInitData(
        bytes calldata initData
    ) internal pure virtual returns (bytes[] calldata signers, uint64 threshold_, uint64[] calldata weights) {
        (signers, threshold_) = _decodeMultisigInitData(initData);

        // Get offset to the weights array (third 32 bytes)
        uint256 weightsOffset = uint256(bytes32(initData[0x40:0x60]));

        // Get the weights array length
        uint256 weightsLength = uint256(bytes32(initData[weightsOffset:weightsOffset + 0x20]));

        // The weights data starts after the length field
        uint256 weightsDataOffset = weightsOffset + 0x20;

        // Validate offset is within bounds and has space for array length
        require(weightsOffset > 0x3f && weightsDataOffset <= initData.length, ERC7579MultisigInvalidInitData());

        // Set up the calldata slice for the weights array
        assembly ("memory-safe") {
            weights.offset := add(initData.offset, weightsDataOffset)
            weights.length := weightsLength
        }

        return (signers, threshold_, weights);
    }

    /**
     * @dev Sets weights for multiple signers at once. Internal version without access control.
     *
     * Requirements:
     *
     * * `signers` and `weights` arrays must have the same length. Reverts with {ERC7579MultisigMismatchedLength} on mismatch.
     * * Each signer must exist in the set of authorized signers. Reverts with {ERC7579MultisigNonexistentSigner} if not.
     * * Each weight must be greater than 0. Reverts with {ERC7579MultisigInvalidWeight} if not.
     * * See {_validateReachableThreshold} for the threshold validation.
     *
     * Emits {ERC7579MultisigWeightChanged} for each signer.
     */
    function _setSignerWeights(address account, bytes[] memory signers, uint64[] memory weights) internal virtual {
        require(signers.length == weights.length, ERC7579MultisigMismatchedLength());

        uint256 extraWeightAdded = 0;
        uint256 extraWeightRemoved = 0;
        for (uint256 i = 0; i < signers.length; ++i) {
            bytes memory signer = signers[i];
            require(isSigner(account, signer), ERC7579MultisigNonexistentSigner(signer));

            uint64 weight = weights[i];
            require(weight > 0, ERC7579MultisigInvalidWeight(signer, weight));

            unchecked {
                uint64 oldExtraWeight = _extraWeights[account][signer];
                uint64 newExtraWeight = weight - 1;

                if (oldExtraWeight != newExtraWeight) {
                    // Overflow impossible: weight values are bounded by uint64 and economic constraints
                    extraWeightRemoved += oldExtraWeight;
                    extraWeightAdded += _extraWeights[account][signer] = newExtraWeight;
                    emit ERC7579MultisigWeightChanged(account, signer, weight);
                }
            }
        }
        unchecked {
            // Safe from underflow: `extraWeightRemoved` is bounded by `_totalExtraWeight` by construction
            // and weight values are bounded by uint64 and economic constraints
            _totalExtraWeight[account] = (uint256(_totalExtraWeight[account]) + extraWeightAdded - extraWeightRemoved)
                .toUint64();
        }
        _validateReachableThreshold(account);
    }

    /**
     * @dev Override to add weight tracking. See {ERC7579Multisig-_addSigners}.
     * Each new signer has a default weight of 1.
     *
     * In cases where {totalWeight} is almost `type(uint64).max` (due to a large `_totalExtraWeight`), adding new
     * signers could cause the {totalWeight} computation to overflow. Adding a {totalWeight} call after the new
     * signers are added ensures no such overflow happens.
     */
    function _addSigners(address account, bytes[] memory newSigners) internal virtual override {
        super._addSigners(account, newSigners);

        // This will revert if the new signers cause an overflow
        _validateReachableThreshold(account);
    }

    /**
     * @dev Override to handle weight tracking during removal. See {ERC7579Multisig-_removeSigners}.
     *
     * Just like {_addSigners}, this function does not emit {ERC7579MultisigWeightChanged} events. The
     * {ERC7913SignerRemoved} event emitted by {ERC7579Multisig-_removeSigners} is enough to track weights here.
     */
    function _removeSigners(address account, bytes[] memory oldSigners) internal virtual override {
        // Clean up weights for removed signers
        //
        // The `extraWeightRemoved` is bounded by `_totalExtraWeight`. The `super._removeSigners` function will revert
        // if the signers array contains any duplicates, ensuring each signer's weight is only counted once. Since
        // `_totalExtraWeight` is stored as a `uint64`, the final subtraction operation is also safe.
        unchecked {
            uint64 extraWeightRemoved = 0;
            for (uint256 i = 0; i < oldSigners.length; ++i) {
                bytes memory signer = oldSigners[i];

                extraWeightRemoved += _extraWeights[account][signer];
                delete _extraWeights[account][signer];
            }
            _totalExtraWeight[account] -= extraWeightRemoved;
        }
        super._removeSigners(account, oldSigners);
    }

    /**
     * @dev Override to validate threshold against total weight instead of signer count.
     *
     * NOTE: This function intentionally does not call `super._validateReachableThreshold` because the base implementation
     * assumes each signer has a weight of 1, which is a subset of this weighted implementation. Consider that multiple
     * implementations of this function may exist in the contract, so important side effects may be missed
     * depending on the linearization order.
     */
    function _validateReachableThreshold(address account) internal view virtual override {
        uint64 weight = totalWeight(account);
        uint64 currentThreshold = threshold(account);
        require(weight >= currentThreshold, ERC7579MultisigUnreachableThreshold(weight, currentThreshold));
    }

    /**
     * @dev Validates that the total weight of signers meets the {threshold} requirement.
     * Overrides the base implementation to use weights instead of count.
     *
     * NOTE: This function intentionally does not call `super._validateThreshold` because the base implementation
     * assumes each signer has a weight of 1, which is incompatible with this weighted implementation.
     */
    function _validateThreshold(
        address account,
        bytes[] calldata validatingSigners
    ) internal view virtual override returns (bool) {
        unchecked {
            uint64 weight = 0;
            for (uint256 i = 0; i < validatingSigners.length; ++i) {
                // Overflow impossible: weight values are bounded by uint64 and economic constraints
                weight += signerWeight(account, validatingSigners[i]);
            }
            return weight >= threshold(account);
        }
    }
}
