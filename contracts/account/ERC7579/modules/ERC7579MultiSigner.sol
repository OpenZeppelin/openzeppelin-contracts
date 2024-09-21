// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC1271} from "../../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";
import {IERC7579Validator, IERC7579Module, MODULE_TYPE_VALIDATOR} from "../../../interfaces/IERC7579Module.sol";
import {EnumerableSet} from "../../../utils/structs/EnumerableSet.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "../../utils/ERC4337Utils.sol";

contract ERC7579MultiSigner is IERC7579Validator, IERC1271 {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SignatureChecker for address;

    event SignerAdded(address indexed account);
    event SignerRemoved(address indexed account);
    event ThresholdChanged(uint256 threshold);

    error SignerAlreadyExists(address account);
    error SignerDoesNotExist(address account);
    error UnreachableThreshold();
    error RemainingSigners();
    error MismatchedSignerSignatures();

    uint256 private _threshold;
    EnumerableSet.AddressSet private _signers;

    function threshold() public view virtual returns (uint256) {
        return _threshold;
    }

    function isSigner(address account) public view virtual returns (bool) {
        return _signers.contains(account);
    }

    function addSigner(address account) external virtual {
        _addSigner(account);
        _validateThreshold();
    }

    function _addSigner(address account) internal {
        if (!_signers.add(account)) revert SignerAlreadyExists(account);
        emit SignerAdded(account);
    }

    function removeSigner(address account) external virtual {
        _removeSigner(account);
        _validateThreshold();
    }

    function _removeSigner(address account) internal {
        if (!_signers.remove(account)) revert SignerDoesNotExist(account);
        emit SignerRemoved(account);
    }

    function setThreshold(uint256 threshold_) external virtual {
        _setThreshold(threshold_);
        _validateThreshold();
    }

    function _setThreshold(uint256 threshold_) internal {
        _threshold = threshold_;
        emit ThresholdChanged(threshold_);
    }

    function _validateThreshold() internal view {
        if (_signers.length() < _threshold) revert UnreachableThreshold();
    }

    /// @inheritdoc IERC7579Module
    function onInstall(bytes calldata data) external {
        (address[] memory signers, uint256 threshold_) = abi.decode(data, (address[], uint256));
        _threshold = threshold_;
        for (uint256 i = 0; i < signers.length; i++) {
            _addSigner(signers[i]);
        }
        _validateThreshold();
    }

    /// @inheritdoc IERC7579Module
    function onUninstall(bytes calldata data) external {
        address[] memory signers = abi.decode(data, (address[]));
        for (uint256 i = 0; i < signers.length; i++) {
            _removeSigner(signers[i]);
        }
        _threshold = 0;
        if (_signers.length() != 0) revert RemainingSigners();
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
        if (signers.length != signatures.length) revert MismatchedSignerSignatures();
        // TODO: Check signers uniqueness
        uint256 count = 0;

        for (uint256 i = 0; i < signers.length; i++) {
            address signer = signers[i];
            bool canSign = isSigner(signer);
            bool isValid = signer.isValidSignatureNow(hash, signatures[i]);
            if (canSign && isValid) {
                count++;
            }
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
