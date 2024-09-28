// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {IERC7579Validator, IERC7579Module, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";
import {SignatureValidator} from "./SignatureValidator.sol";

abstract contract MultiERC1271Validator is SignatureValidator {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SignatureChecker for address;

    event ERC1271SignersAdded(address indexed account, address[] indexed signers);
    event ERC1271SignersRemoved(address indexed account, address[] indexed signers);
    event ThresholdChanged(address indexed account, uint256 threshold);

    error MultiERC1271SignerAlreadyExists(address account, address signer);
    error MultiERC1271SignerDoesNotExist(address account, address signer);
    error MultiERC1271UnreachableThreshold(address account, uint256 signers, uint256 threshold);
    error MultiERC1271RemainingSigners(address account, uint256 remaining);

    mapping(address => EnumerableSet.AddressSet) private _associatedSigners;
    mapping(address => uint256) private _associatedThreshold;

    function threshold(address account) public view virtual returns (uint256) {
        return _associatedThreshold[account];
    }

    function isSigner(address account, address signer) public view virtual returns (bool) {
        return _associatedSigners[account].contains(signer);
    }

    function addSigners(address[] memory signers) public virtual {
        address account = msg.sender;
        _addERC1271Signers(account, signers);
        _validateThreshold(account);
    }

    function removeSigners(address[] memory signers) public virtual {
        address account = msg.sender;
        _removeSigners(account, signers);
        _validateThreshold(account);
    }

    function setThreshold(uint256 threshold_) public virtual {
        address account = msg.sender;
        _setThreshold(account, threshold_);
        _validateThreshold(account);
    }

    /// @inheritdoc IERC7579Module
    function onInstall(bytes memory data) public virtual {
        address account = msg.sender;
        (address[] memory signers, uint256 threshold_) = abi.decode(data, (address[], uint256));
        _associatedThreshold[account] = threshold_;
        _addERC1271Signers(account, signers);
        _validateThreshold(account);
    }

    /// @inheritdoc IERC7579Module
    function onUninstall(bytes memory data) public virtual {
        address account = msg.sender;
        address[] memory signers = abi.decode(data, (address[]));
        _associatedThreshold[account] = 0;
        _removeSigners(account, signers);
        uint256 remaining = _associatedSigners[account].length();
        if (remaining != 0) revert MultiERC1271RemainingSigners(account, remaining);
    }

    function _addERC1271Signers(address account, address[] memory signers) internal virtual {
        for (uint256 i = 0; i < signers.length; i++) {
            if (!_associatedSigners[account].add(signers[i]))
                revert MultiERC1271SignerAlreadyExists(account, signers[i]);
        }
        emit ERC1271SignersAdded(account, signers);
    }

    function _removeSigners(address account, address[] memory signers) internal virtual {
        for (uint256 i = 0; i < signers.length; i++) {
            if (!_associatedSigners[account].remove(signers[i]))
                revert MultiERC1271SignerDoesNotExist(account, signers[i]);
        }
        emit ERC1271SignersRemoved(account, signers);
    }

    function _setThreshold(address account, uint256 threshold_) internal virtual {
        _associatedThreshold[account] = threshold_;
        emit ThresholdChanged(msg.sender, threshold_);
    }

    function _validateThreshold(address account) internal view virtual {
        uint256 signers = _associatedSigners[account].length();
        uint256 _threshold = _associatedThreshold[account];
        if (signers < _threshold) revert MultiERC1271UnreachableThreshold(account, signers, _threshold);
    }

    function _isValidSignatureWithSender(
        address sender,
        bytes32 envelopeHash,
        bytes calldata signature
    ) internal view virtual override returns (bool) {
        (address[] calldata signers, bytes[] calldata signatures) = _decodePackedSignatures(signature);
        if (signers.length != signatures.length) return false;
        return _validateNSignatures(sender, envelopeHash, signers, signatures);
    }

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
