// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {IERC7579Validator, IERC7579Module, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";

contract ERC7579MultisigValidator is IERC7579Validator, IERC1271 {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SignatureChecker for address;

    event SignersAdded(address[] indexed accounts);
    event SignersRemoved(address[] indexed accounts);
    event ThresholdChanged(uint256 threshold);

    error MultisigSignerAlreadyExists(address account);
    error MultisigSignerDoesNotExist(address account);
    error MultisigUnreachableThreshold(uint256 signers, uint256 threshold);
    error MultisigRemainingSigners(uint256 remaining);
    error MultisigMismatchedSignaturesLength(uint256 signersLength, uint256 signaturesLength);
    error MultisigUnorderedSigners(address prev, address current);

    uint256 private _threshold;
    EnumerableSet.AddressSet private _signers;

    function threshold() public view virtual returns (uint256) {
        return _threshold;
    }

    function isSigner(address account) public view virtual returns (bool) {
        return _signers.contains(account);
    }

    function addSigners(address[] memory accounts) external virtual {
        _addSigners(accounts);
        _validateThreshold();
    }

    function _addSigners(address[] memory accounts) internal virtual {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (!_signers.add(accounts[i])) revert MultisigSignerAlreadyExists(accounts[i]);
        }
        emit SignersAdded(accounts);
    }

    function removeSigners(address[] memory accounts) external virtual {
        _removeSigners(accounts);
        _validateThreshold();
    }

    function _removeSigners(address[] memory accounts) internal virtual {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (!_signers.remove(accounts[i])) revert MultisigSignerDoesNotExist(accounts[i]);
        }
        emit SignersRemoved(accounts);
    }

    function setThreshold(uint256 threshold_) external virtual {
        _setThreshold(threshold_);
        _validateThreshold();
    }

    function _setThreshold(uint256 threshold_) internal virtual {
        _threshold = threshold_;
        emit ThresholdChanged(threshold_);
    }

    function _validateThreshold() internal view virtual {
        uint256 signers = _signers.length();
        if (signers < _threshold) revert MultisigUnreachableThreshold(signers, _threshold);
    }

    /// @inheritdoc IERC7579Module
    function onInstall(bytes calldata data) external {
        (address[] memory signers, uint256 threshold_) = abi.decode(data, (address[], uint256));
        _threshold = threshold_;
        _addSigners(signers);
        _validateThreshold();
    }

    /// @inheritdoc IERC7579Module
    function onUninstall(bytes calldata data) external {
        address[] memory signers = abi.decode(data, (address[]));
        _threshold = 0;
        _removeSigners(signers);
        uint256 remaining = _signers.length();
        if (remaining != 0) revert MultisigRemainingSigners(remaining);
    }

    /// @inheritdoc IERC7579Module
    function isModuleType(uint256 moduleTypeId) external pure returns (bool) {
        return moduleTypeId == MODULE_TYPE_VALIDATOR;
    }

    /// @inheritdoc IERC7579Validator
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash) external view returns (uint256) {
        return
            _isValidSignature(userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /// @inheritdoc IERC1271
    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4) {
        return _isValidSignature(hash, signature) ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }

    function _isValidSignature(bytes32 hash, bytes calldata signature) internal view returns (bool) {
        (address[] memory signers, bytes[] memory signatures) = abi.decode(signature, (address[], bytes[]));
        if (signers.length != signatures.length)
            revert MultisigMismatchedSignaturesLength(signers.length, signatures.length);

        uint256 count = 0;
        address currentSigner = address(0);

        for (uint256 i = 0; i < signers.length; i++) {
            // Signers must be in order to ensure no duplicates
            address signer = signers[i];
            if (currentSigner >= signer) revert MultisigUnorderedSigners(currentSigner, signer);
            currentSigner = signer;

            bool canSign = isSigner(signer);
            bool isValid = signer.isValidSignatureNow(hash, signatures[i]);
            if (canSign && isValid) count++;
        }

        return count >= threshold();
    }

    /// @inheritdoc IERC7579Validator
    function isValidSignatureWithSender(
        address,
        bytes32 hash,
        bytes calldata signature
    ) external view returns (bytes4) {
        return _isValidSignature(hash, signature) ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }
}
