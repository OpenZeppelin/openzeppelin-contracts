// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IEntryPoint} from "../../interfaces/IERC4337.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "./../utils/ERC4337Utils.sol";

abstract contract Account is IAccount {
    error AccountEntryPointRestricted();
    error AccountInvalidBatchLength();

    /****************************************************************************************************************
     *                                                  Modifiers                                                   *
     ****************************************************************************************************************/

    modifier onlyEntryPoint() {
        if (msg.sender != address(entryPoint())) {
            revert AccountEntryPointRestricted();
        }
        _;
    }

    /****************************************************************************************************************
     *                                                    Hooks                                                     *
     ****************************************************************************************************************/

    /**
     * @dev Return the entryPoint used by this account.
     * Subclass should return the current entryPoint used by this account.
     */
    function entryPoint() public view virtual returns (IEntryPoint);

    /**
     * @dev Return weither an address (identity) is authorized to operate on this account.
     * Subclass must implement this using their own access control mechanism.
     */
    function _isAuthorized(address) internal virtual returns (bool);

    /**
     * @dev Return the recovered signer, and signature validity window.
     * Subclass must implement this following their choice of cryptography.
     * If a signature is ill-formed, address(0) should be returned.
     */
    function _processSignature(
        bytes memory signature,
        bytes32 userOpHash
    ) internal virtual returns (address, uint48, uint48);

    /****************************************************************************************************************
     *                                               Public interface                                               *
     ****************************************************************************************************************/

    /**
     * @dev Return the account nonce for the canonical sequence.
     */
    function getNonce() public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), 0);
    }

    /**
     * @dev Return the account nonce for a given sequence (key).
     */
    function getNonce(uint192 key) public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), key);
    }

    /// @inheritdoc IAccount
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external virtual override onlyEntryPoint returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);
        _validateNonce(userOp.nonce);
        _payPrefund(missingAccountFunds);
    }

    /****************************************************************************************************************
     *                                             Internal mechanisms                                              *
     ****************************************************************************************************************/

    /**
     * @dev Validate the signature is valid for this message.
     * @param userOp          - Validate the userOp.signature field.
     * @param userOpHash      - Convenient field: the hash of the request, to check the signature against.
     *                          (also hashes the entrypoint and chain id)
     * @return validationData - Signature and time-range of this operation.
     *                          <20-byte> aggregatorOrSigFail - 0 for valid signature, 1 to mark signature failure,
     *                                    otherwise, an address of an aggregator contract.
     *                          <6-byte> validUntil - last timestamp this operation is valid. 0 for "indefinite"
     *                          <6-byte> validAfter - first timestamp this operation is valid
     *                          If the account doesn't use time-range, it is enough to return
     *                          SIG_VALIDATION_FAILED value (1) for signature failure.
     *                          Note that the validation code cannot use block.timestamp (or block.number) directly.
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual returns (uint256 validationData) {
        (address signer, uint48 validAfter, uint48 validUntil) = _processSignature(userOp.signature, userOpHash);
        return ERC4337Utils.packValidationData(signer != address(0) && _isAuthorized(signer), validAfter, validUntil);
    }

    /**
     * @dev Validate the nonce of the UserOperation.
     * This method may validate the nonce requirement of this account.
     * e.g.
     * To limit the nonce to use sequenced UserOps only (no "out of order" UserOps):
     *      `require(nonce < type(uint64).max)`
     *
     * The actual nonce uniqueness is managed by the EntryPoint, and thus no other
     * action is needed by the account itself.
     *
     * @param nonce to validate
     */
    function _validateNonce(uint256 nonce) internal view virtual {}

    /**
     * @dev Sends to the entrypoint (msg.sender) the missing funds for this transaction.
     * SubClass MAY override this method for better funds management
     * (e.g. send to the entryPoint more than the minimum required, so that in future transactions
     * it will not be required to send again).
     * @param missingAccountFunds - The minimum value this method should send the entrypoint.
     *                              This value MAY be zero, in case there is enough deposit,
     *                              or the userOp has a paymaster.
     */
    function _payPrefund(uint256 missingAccountFunds) internal virtual {
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            success;
            //ignore failure (its EntryPoint's job to verify, not account.)
        }
    }
}
