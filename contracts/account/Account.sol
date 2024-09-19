// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../interfaces/IERC1271.sol";
import {PackedUserOperation, IAccount, IEntryPoint, IAccountExecute} from "../interfaces/IERC4337.sol";
import {Address} from "../utils/Address.sol";
import {ERC1155Holder} from "../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC721Holder} from "../token/ERC721/utils/ERC721Holder.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";
import {ReadableSigner} from "./ReadableSigner.sol";

abstract contract Account is IAccount, IAccountExecute, ReadableSigner, ERC1155Holder, ERC721Holder {
    error AccountEntryPointRestricted();

    IEntryPoint private immutable _entryPoint;

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint())) {
            revert AccountEntryPointRestricted();
        }
        _;
    }

    constructor(IEntryPoint entryPoint_) {
        _entryPoint = entryPoint_;
    }

    function entryPoint() public view virtual returns (IEntryPoint) {
        return _entryPoint;
    }

    /// @dev Return the account nonce for the canonical sequence.
    function getNonce() public view virtual returns (uint256) {
        return getNonce(0);
    }

    /// @dev Return the account nonce for a given sequence (key).
    function getNonce(uint192 key) public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), key);
    }

    /// @inheritdoc IAccount
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) public virtual onlyEntryPoint returns (uint256) {
        (, uint256 validationData) = _validateUserOp(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
        return validationData;
    }

    /// @inheritdoc IAccountExecute
    function executeUserOp(PackedUserOperation calldata userOp, bytes32 /*userOpHash*/) public virtual onlyEntryPoint {
        Address.functionDelegateCall(address(this), userOp.callData[4:]);
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual returns (address signer, uint256 validationData) {
        bool isValid = isValidSignature(userOpHash, userOp.signature) == IERC1271.isValidSignature.selector;
        if (!isValid) return (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
        return (address(this), ERC4337Utils.SIG_VALIDATION_SUCCESS);
    }

    function _payPrefund(uint256 missingAccountFunds) internal virtual {
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            success;
            //ignore failure (its EntryPoint's job to verify, not account.)
        }
    }

    /// @dev Receive Ether.
    receive() external payable virtual {}
}
