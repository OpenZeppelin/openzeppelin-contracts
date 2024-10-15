// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";
import {IERC7579Validator, IERC7579Module, MODULE_TYPE_VALIDATOR} from "../../interfaces/draft-IERC7579.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "../utils/draft-ERC4337Utils.sol";
import {SignatureValidator} from "./draft-SignatureValidator.sol";

/**
 * @dev A {SignatureValidator} module that supports multiple ERC1271 signers and a threshold.
 *
 * This module allows to register multiple ERC1271 signers for an account and set a threshold
 * of required signatures to validate a user operation. The threshold must be less or equal to
 * the number of associated signers.
 *
 * NOTE: Using this contract as part of the validation phase of an user operation might violate
 * the ERC-7562 storage validation rules if any of the signers access storage that's not
 * associated with the account contract (e.g. an upgradeable account will access the implementation slot).
 */
abstract contract MultiERC1271Validator is SignatureValidator {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SignatureChecker for address;

    /**
     * @dev Emitted when signers are added to an account.
     */
    event ERC1271SignersAdded(address indexed account, address[] indexed signers);

    /**
     * @dev Emitted when signers are removed from an account.
     */
    event ERC1271SignersRemoved(address indexed account, address[] indexed signers);

    /**
     * @dev Emitted when the threshold is changed for an account.
     */
    event ThresholdChanged(address indexed account, uint256 threshold);

    /**
     * @dev The `signer` already exists for the `account`.
     */
    error MultiERC1271SignerAlreadyExists(address account, address signer);

    /**
     * @dev The `signer` does not exist for the `account`.
     */
    error MultiERC1271SignerDoesNotExist(address account, address signer);

    /**
     * @dev The threshold is unreachable for the `account` given the number of `signers`.
     */
    error MultiERC1271UnreachableThreshold(address account, uint256 signers, uint256 threshold);

    /**
     * @dev The `account` has remaining signers that must be removed before uninstalling the module.
     */
    error MultiERC1271RemainingSigners(address account, uint256 remaining);

    mapping(address => EnumerableSet.AddressSet) private _associatedSigners;
    mapping(address => uint256) private _associatedThreshold;

    /**
     * @dev Amount of account signatures required to approve a multisignature operation.
     */
    function threshold(address account) public view virtual returns (uint256) {
        return _associatedThreshold[account];
    }

    /**
     * @dev Returns whether the `signer` is a signer for the `account`.
     */
    function isSigner(address account, address signer) public view virtual returns (bool) {
        return _associatedSigners[account].contains(signer);
    }

    /**
     * @dev Registers `signers` as authorized signers for the `account`.
     */
    function addSigners(address[] memory signers) public virtual {
        address account = msg.sender;
        _addERC1271Signers(account, signers);
        _validateThreshold(account);
    }

    /**
     * @dev Removes `signers` from the authorized signers for the `account`.
     */
    function removeSigners(address[] memory signers) public virtual {
        address account = msg.sender;
        _removeSigners(account, signers);
        _validateThreshold(account);
    }

    /**
     * @dev Sets the amount of signatures required to approve a multisignature operation.
     */
    function setThreshold(uint256 threshold_) public virtual {
        address account = msg.sender;
        _setThreshold(account, threshold_);
        _validateThreshold(account);
    }

    /**
     * @dev Installs the module with the initial `signers` and `threshold_` encoded as `data`.
     *
     * See {IERC7579Module-onInstall}.
     */
    function onInstall(bytes memory data) public virtual {
        address account = msg.sender;
        (address[] memory signers, uint256 threshold_) = abi.decode(data, (address[], uint256));
        _associatedThreshold[account] = threshold_;
        _addERC1271Signers(account, signers);
        _validateThreshold(account);
    }

    /**
     * @dev Uninstalls the module and cleans up the registered signers.
     *
     * See {IERC7579Module-onUninstall}.
     */
    function onUninstall(bytes memory data) public virtual {
        address account = msg.sender;
        address[] memory signers = abi.decode(data, (address[]));
        _associatedThreshold[account] = 0;
        _removeSigners(account, signers);
        uint256 remaining = _associatedSigners[account].length();
        if (remaining != 0) revert MultiERC1271RemainingSigners(account, remaining);
    }

    /**
     * @dev Adds the `signers` to the `account` authorized signers. Internal version without access control.
     */
    function _addERC1271Signers(address account, address[] memory signers) internal virtual {
        for (uint256 i = 0; i < signers.length; i++) {
            if (!_associatedSigners[account].add(signers[i]))
                revert MultiERC1271SignerAlreadyExists(account, signers[i]);
        }
        emit ERC1271SignersAdded(account, signers);
    }

    /**
     * @dev Removes the `signers` from the `account` authorized signers. Internal version without access control.
     */
    function _removeSigners(address account, address[] memory signers) internal virtual {
        for (uint256 i = 0; i < signers.length; i++) {
            if (!_associatedSigners[account].remove(signers[i]))
                revert MultiERC1271SignerDoesNotExist(account, signers[i]);
        }
        emit ERC1271SignersRemoved(account, signers);
    }

    /**
     * @dev Sets the `threshold_` for the `account`. Internal version without access control.
     */
    function _setThreshold(address account, uint256 threshold_) internal virtual {
        _associatedThreshold[account] = threshold_;
        emit ThresholdChanged(msg.sender, threshold_);
    }

    /**
     * @dev Validates the current threshold is reachable for the `account`.
     */
    function _validateThreshold(address account) internal view virtual {
        uint256 signers = _associatedSigners[account].length();
        uint256 _threshold = _associatedThreshold[account];
        if (signers < _threshold) revert MultiERC1271UnreachableThreshold(account, signers, _threshold);
    }

    /**
     * @dev Validates a signature for a specific sender.
     *
     * The `signers` MUST be registered signers for the `account`. Also, both the `signers`
     * and `signatures` must be in order to validate the signatures correctly. See
     * {_decodePackedSignatures}.
     *
     * NOTE: The `signers` list must be in ascending order to ensure no duplicates. Otherwise,
     * the multisignature will be rejected.
     */
    function _isValidSignatureWithSender(
        address sender,
        bytes32 nestedHash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (address[] calldata signers, bytes[] calldata signatures) = _decodePackedSignatures(signature);
        if (signers.length != signatures.length) return false;
        return _validateNSignatures(sender, nestedHash, signers, signatures);
    }

    /**
     * @dev Checks if the `signatures` are valid for the provided `signers` and `hash`.
     *
     * Internal version of {_isValidSignatureWithSender}.
     */
    function _validateNSignatures(
        address account,
        bytes32 hash,
        address[] calldata signers,
        bytes[] calldata signatures
    ) private view returns (bool) {
        address currentSigner = address(0);

        uint256 signersLength = signers.length;
        for (uint256 i = 0; i < signersLength; i++) {
            // Signers must be in order to ensure no duplicates
            address signer = signers[i];
            if (currentSigner >= signer) return false;
            currentSigner = signer;

            if (!_associatedSigners[account].contains(signer) || !signer.isValidSignatureNow(hash, signatures[i]))
                return false;
        }

        return signersLength >= _associatedThreshold[account];
    }

    /**
     * @dev Splits a signature into signers and signatures.
     *
     * The format of the signature is `abi.encode(signers[], signatures[])`.
     */
    function _decodePackedSignatures(
        bytes calldata signature
    ) internal pure returns (address[] calldata signers, bytes[] calldata signatures) {
        assembly ("memory-safe") {
            let ptr := add(signature.offset, calldataload(signature.offset))

            let signersPtr := add(ptr, 0x20)
            signers.offset := add(signersPtr, 0x20)
            signers.length := calldataload(signersPtr)

            let signaturesPtr := add(signersPtr, signers.length)
            signatures.offset := add(signaturesPtr, 0x20)
            signatures.length := calldataload(signaturesPtr)
        }
    }
}
