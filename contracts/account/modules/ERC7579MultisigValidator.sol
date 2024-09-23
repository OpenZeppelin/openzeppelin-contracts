// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {IERC7579Validator, IERC7579Module, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {IERC7579Execution} from "../../interfaces/IERC7579Account.sol";
import {EnumerableSet} from "../../utils/structs/EnumerableSet.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";
import {ERC7579Utils, CallType, ExecType, Execution, Mode, ModeSelector, ModePayload} from "../utils/ERC7579Utils.sol";
import {EIP712} from "../../utils//cryptography/EIP712.sol";
import {EIP712NestedUtils} from "../../utils/cryptography/EIP712NestedUtils.sol";

abstract contract ERC7579MultisigValidator is IERC7579Validator, EIP712, IERC1271 {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SignatureChecker for address;

    event SignersAdded(address indexed account, address[] indexed signers);
    event SignersRemoved(address indexed account, address[] indexed signers);
    event ThresholdChanged(address indexed account, uint256 threshold);

    error MultisigSignerAlreadyExists(address account, address signer);
    error MultisigSignerDoesNotExist(address account, address signer);
    error MultisigUnreachableThreshold(address account, uint256 signers, uint256 threshold);
    error MultisigRemainingSigners(address account, uint256 remaining);
    error MultisigMismatchedSignaturesLength(address account, uint256 signersLength, uint256 signaturesLength);
    error MultisigUnorderedSigners(address account, address prev, address current);

    error MultisigUnauthorizedExecution(address account, address sender);

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
        _addSigners(account, signers);
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
        _addSigners(account, signers);
        _validateThreshold(account);
    }

    /// @inheritdoc IERC7579Module
    function onUninstall(bytes memory data) public virtual {
        address account = msg.sender;
        address[] memory signers = abi.decode(data, (address[]));
        _associatedThreshold[account] = 0;
        _removeSigners(account, signers);
        uint256 remaining = _associatedSigners[account].length();
        if (remaining != 0) revert MultisigRemainingSigners(account, remaining);
    }

    /// @inheritdoc IERC7579Module
    function isModuleType(uint256 moduleTypeId) public pure virtual returns (bool) {
        return moduleTypeId == MODULE_TYPE_VALIDATOR;
    }

    /// @inheritdoc IERC7579Validator
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public view virtual returns (uint256) {
        return
            _isValidSignature(msg.sender, userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    /// @inheritdoc IERC1271
    function isValidSignature(bytes32 hash, bytes calldata signature) public view virtual returns (bytes4) {
        address account = address(bytes20(signature[0:20]));
        bytes calldata sig = signature[20:];
        return _isValidSignature(account, hash, sig) ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }

    /// @inheritdoc IERC7579Validator
    function isValidSignatureWithSender(
        address,
        bytes32 hash,
        bytes calldata signature
    ) public view virtual returns (bytes4) {
        return _isValidSignature(msg.sender, hash, signature) ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }

    function _addSigners(address account, address[] memory signers) internal virtual {
        for (uint256 i = 0; i < signers.length; i++) {
            if (!_associatedSigners[account].add(signers[i])) revert MultisigSignerAlreadyExists(account, signers[i]);
        }
        emit SignersAdded(account, signers);
    }

    function _removeSigners(address account, address[] memory signers) internal virtual {
        for (uint256 i = 0; i < signers.length; i++) {
            if (!_associatedSigners[account].remove(signers[i])) revert MultisigSignerDoesNotExist(account, signers[i]);
        }
        emit SignersRemoved(account, signers);
    }

    function _setThreshold(address account, uint256 threshold_) internal virtual {
        _associatedThreshold[account] = threshold_;
        emit ThresholdChanged(msg.sender, threshold_);
    }

    function _validateThreshold(address account) internal view virtual {
        uint256 signers = _associatedSigners[account].length();
        uint256 _threshold = _associatedThreshold[account];
        if (signers < _threshold) revert MultisigUnreachableThreshold(account, signers, _threshold);
    }

    function _isValidSignature(
        address account,
        bytes32 hash,
        bytes memory signature
    ) internal view virtual returns (bool) {
        (address[] memory signers, bytes[] memory signatures) = abi.decode(signature, (address[], bytes[]));
        if (signers.length != signatures.length)
            revert MultisigMismatchedSignaturesLength(account, signers.length, signatures.length);

        uint256 count = 0;
        address currentSigner = address(0);

        for (uint256 i = 0; i < signers.length; i++) {
            // Signers must be in order to ensure no duplicates
            address signer = signers[i];
            if (currentSigner >= signer) revert MultisigUnorderedSigners(account, currentSigner, signer);
            currentSigner = signer;

            bool canSign = _associatedSigners[account].contains(signer);
            bool isValid = signer.isValidSignatureNow(hash, signatures[i]);
            if (canSign && isValid) count++;
        }

        return count >= _associatedThreshold[account];
    }
}
