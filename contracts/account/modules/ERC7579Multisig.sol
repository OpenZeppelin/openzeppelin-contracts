// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Mode} from "../../account/utils/draft-ERC7579Utils.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";
import {ERC7579Validator} from "./ERC7579Validator.sol";

/**
 * @dev Implementation of an {ERC7579Validator} that uses ERC-7913 signers for multisignature
 * validation.
 *
 * This module provides a base implementation for multisignature validation that can be
 * attached to any function through the {_rawERC7579Validation} internal function. The signers
 * are represented using the ERC-7913 format, which concatenates a verifier address and
 * a key: `verifier || key`.
 *
 * A smart account with this module installed can require multiple signers to approve
 * operations before they are executed, such as requiring 3-of-5 guardians to approve
 * a social recovery operation.
 */
abstract contract ERC7579Multisig is ERC7579Validator {
    using EnumerableSet for EnumerableSet.BytesSet;
    using SignatureChecker for bytes32;
    using SignatureChecker for bytes;

    /// @dev Emitted when signers are added.
    event ERC7913SignerAdded(address indexed account, bytes signer);

    /// @dev Emitted when signers are removed.
    event ERC7913SignerRemoved(address indexed account, bytes signer);

    /// @dev Emitted when the threshold is updated.
    event ERC7913ThresholdSet(address indexed account, uint64 threshold);

    /// @dev The `signer` already exists.
    error ERC7579MultisigAlreadyExists(bytes signer);

    /// @dev The `signer` does not exist.
    error ERC7579MultisigNonexistentSigner(bytes signer);

    /// @dev The `signer` is less than 20 bytes long.
    error ERC7579MultisigInvalidSigner(bytes signer);

    /// @dev The `threshold` is zero.
    error ERC7579MultisigZeroThreshold();

    /// @dev The `threshold` is unreachable given the number of `signers`.
    error ERC7579MultisigUnreachableThreshold(uint64 signers, uint64 threshold);

    mapping(address account => EnumerableSet.BytesSet) private _signersSetByAccount;
    mapping(address account => uint64) private _thresholdByAccount;

    /**
     * @dev Sets up the module's initial configuration when installed by an account.
     * See {ERC7579DelayedExecutor-onInstall}. Besides the delay setup, the `initdata` can
     * include `signers` and `threshold`.
     *
     * The initData should be encoded as:
     * `abi.encode(bytes[] signers, uint64 threshold)`
     *
     * If no signers or threshold are provided, the multisignature functionality will be
     * disabled until they are added later.
     *
     * NOTE: An account can only call onInstall once. If called directly by the account,
     * the signer will be set to the provided data. Future installations will behave as a no-op.
     */
    function onInstall(bytes calldata initData) public virtual {
        if (initData.length > 32 && getSignerCount(msg.sender) == 0) {
            // More than just delay parameter
            (bytes[] memory signers_, uint64 threshold_) = abi.decode(initData, (bytes[], uint64));
            _addSigners(msg.sender, signers_);
            _setThreshold(msg.sender, threshold_);
        }
    }

    /**
     * @dev Cleans up module's configuration when uninstalled from an account.
     * Clears all signers and resets the threshold.
     *
     * See {ERC7579DelayedExecutor-onUninstall}.
     *
     * WARNING: This function has unbounded gas costs and may become uncallable if the set grows too large.
     * See {EnumerableSet-clear}.
     */
    function onUninstall(bytes calldata /* data */) public virtual {
        _signersSetByAccount[msg.sender].clear();
        delete _thresholdByAccount[msg.sender];
    }

    /**
     * @dev Returns a slice of the set of authorized signers for the specified account.
     *
     * Using `start = 0` and `end = type(uint64).max` will return the entire set of signers.
     *
     * WARNING: Depending on the `start` and `end`, this operation can copy a large amount of data to memory, which
     * can be expensive. This is designed for view accessors queried without gas fees. Using it in state-changing
     * functions may become uncallable if the slice grows too large.
     */
    function getSigners(address account, uint64 start, uint64 end) public view virtual returns (bytes[] memory) {
        return _signersSetByAccount[account].values(start, end);
    }

    /// @dev Returns the number of authorized signers for the specified account.
    function getSignerCount(address account) public view virtual returns (uint256) {
        return _signersSetByAccount[account].length();
    }

    /// @dev Returns whether the `signer` is an authorized signer for the specified account.
    function isSigner(address account, bytes memory signer) public view virtual returns (bool) {
        return _signersSetByAccount[account].contains(signer);
    }

    /**
     * @dev Returns the minimum number of signers required to approve a multisignature operation
     * for the specified account.
     */
    function threshold(address account) public view virtual returns (uint64) {
        return _thresholdByAccount[account];
    }

    /**
     * @dev Adds new signers to the authorized set for the calling account.
     * Can only be called by the account itself.
     *
     * Requirements:
     *
     * * Each of `newSigners` must be at least 20 bytes long.
     * * Each of `newSigners` must not be already authorized.
     */
    function addSigners(bytes[] memory newSigners) public virtual {
        _addSigners(msg.sender, newSigners);
    }

    /**
     * @dev Removes signers from the authorized set for the calling account.
     * Can only be called by the account itself.
     *
     * Requirements:
     *
     * * Each of `oldSigners` must be authorized.
     * * After removal, the threshold must still be reachable.
     */
    function removeSigners(bytes[] memory oldSigners) public virtual {
        _removeSigners(msg.sender, oldSigners);
    }

    /**
     * @dev Sets the threshold for the calling account.
     * Can only be called by the account itself.
     *
     * Requirements:
     *
     * * The threshold must be reachable with the current number of signers.
     */
    function setThreshold(uint64 newThreshold) public virtual {
        _setThreshold(msg.sender, newThreshold);
    }

    /**
     * @dev Returns whether the number of valid signatures meets or exceeds the
     * threshold set for the target account.
     *
     * The signature should be encoded as:
     * `abi.encode(bytes[] signingSigners, bytes[] signatures)`
     *
     * Where `signingSigners` are the authorized signers and signatures are their corresponding
     * signatures of the operation `hash`.
     */
    function _rawERC7579Validation(
        address account,
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (bytes[] memory signingSigners, bytes[] memory signatures) = abi.decode(signature, (bytes[], bytes[]));
        return
            _validateThreshold(account, signingSigners) &&
            _validateSignatures(account, hash, signingSigners, signatures);
    }

    /**
     * @dev Adds the `newSigners` to those allowed to sign on behalf of the account.
     *
     * Requirements:
     *
     * * Each of `newSigners` must be at least 20 bytes long. Reverts with {ERC7579MultisigInvalidSigner} if not.
     * * Each of `newSigners` must not be authorized. Reverts with {ERC7579MultisigAlreadyExists} if it already exists.
     */
    function _addSigners(address account, bytes[] memory newSigners) internal virtual {
        for (uint256 i = 0; i < newSigners.length; ++i) {
            bytes memory signer = newSigners[i];
            require(signer.length >= 20, ERC7579MultisigInvalidSigner(signer));
            require(_signersSetByAccount[account].add(signer), ERC7579MultisigAlreadyExists(signer));
            emit ERC7913SignerAdded(account, signer);
        }
    }

    /**
     * @dev Removes the `oldSigners` from the authorized signers for the account.
     *
     * Requirements:
     *
     * * Each of `oldSigners` must be authorized. Reverts with {ERC7579MultisigNonexistentSigner} if not.
     * * The threshold must remain reachable after removal. See {_validateReachableThreshold} for details.
     */
    function _removeSigners(address account, bytes[] memory oldSigners) internal virtual {
        for (uint256 i = 0; i < oldSigners.length; ++i) {
            bytes memory signer = oldSigners[i];
            require(_signersSetByAccount[account].remove(signer), ERC7579MultisigNonexistentSigner(signer));
            emit ERC7913SignerRemoved(account, signer);
        }
        _validateReachableThreshold(account);
    }

    /**
     * @dev Sets the signatures `threshold` required to approve a multisignature operation.
     *
     * Requirements:
     *
     * * The threshold must be greater than 0. Reverts with {ERC7579MultisigZeroThreshold} if not.
     * * The threshold must be reachable with the current number of signers. See {_validateReachableThreshold} for details.
     */
    function _setThreshold(address account, uint64 newThreshold) internal virtual {
        require(newThreshold > 0, ERC7579MultisigZeroThreshold());
        _thresholdByAccount[account] = newThreshold;
        _validateReachableThreshold(account);
        emit ERC7913ThresholdSet(account, newThreshold);
    }

    /**
     * @dev Validates the current threshold is reachable with the number of {signers}.
     *
     * Requirements:
     *
     * * The number of signers must be >= the threshold. Reverts with {ERC7579MultisigUnreachableThreshold} if not.
     */
    function _validateReachableThreshold(address account) internal view virtual {
        uint256 totalSigners = getSignerCount(account);
        uint64 currentThreshold = threshold(account);
        require(
            totalSigners >= currentThreshold,
            ERC7579MultisigUnreachableThreshold(
                uint64(totalSigners), // Safe cast. Economically impossible to overflow.
                currentThreshold
            )
        );
    }

    /**
     * @dev Validates the signatures using the signers and their corresponding signatures.
     * Returns whether the signers are authorized and the signatures are valid for the given hash.
     *
     * The signers must be ordered by their `keccak256` hash to prevent duplications and to optimize
     * the verification process. The function will return `false` if any signer is not authorized or
     * if the signatures are invalid for the given hash.
     *
     * Requirements:
     *
     * * The `signatures` array must be at least the `signers` array's length.
     */
    function _validateSignatures(
        address account,
        bytes32 hash,
        bytes[] memory signingSigners,
        bytes[] memory signatures
    ) internal view virtual returns (bool valid) {
        for (uint256 i = 0; i < signingSigners.length; ++i) {
            if (!isSigner(account, signingSigners[i])) {
                return false;
            }
        }
        return hash.areValidSignaturesNow(signingSigners, signatures);
    }

    /**
     * @dev Validates that the number of signers meets the {threshold} requirement.
     * Assumes the signers were already validated. See {_validateSignatures} for more details.
     */
    function _validateThreshold(
        address account,
        bytes[] memory validatingSigners
    ) internal view virtual returns (bool) {
        return validatingSigners.length >= threshold(account);
    }
}
