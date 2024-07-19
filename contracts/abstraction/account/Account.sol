// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IAccountExecute, IEntryPoint} from "../../interfaces/IERC4337.sol";
import {ERC4337Utils} from "./../utils/ERC4337Utils.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {Address} from "../../utils/Address.sol";

abstract contract Account is IAccount, IAccountExecute {
    error AccountEntryPointRestricted();

    /****************************************************************************************************************
     *                                                  Modifiers                                                   *
     ****************************************************************************************************************/

    modifier onlyEntryPointOrSelf() {
        if (msg.sender != address(this) && msg.sender != address(entryPoint())) {
            revert AccountEntryPointRestricted();
        }
        _;
    }

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
     *
     * Subclass should return the current entryPoint used by this account.
     */
    function entryPoint() public view virtual returns (IEntryPoint);

    /**
     * @dev Return weither an address (identity) is authorized to operate on this account. Depending on how the
     * account is configured, this can be interpreted as either the owner of the account (if operating using a single
     * owner -- default) or as an authorized signer if operating using as a multisig account.
     *
     * Subclass must implement this using their own access control mechanism.
     */
    function _isAuthorized(address) internal view virtual returns (bool);

    /**
     * @dev Recover the signer for a given signature and user operation hash. This function does not need to verify
     * that the recovered signer is authorized.
     *
     * Subclass must implement this using their own choice of cryptography.
     */
    function _recoverSigner(bytes32 userOpHash, bytes calldata signature) internal view virtual returns (address);

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
    ) public virtual onlyEntryPoint returns (uint256 validationData) {
        (bool valid, , uint48 validAfter, uint48 validUntil) = _processSignature(userOpHash, userOp.signature);
        _validateNonce(userOp.nonce);
        _payPrefund(missingAccountFunds);
        return ERC4337Utils.packValidationData(valid, validAfter, validUntil);
    }

    /// @inheritdoc IAccountExecute
    function executeUserOp(PackedUserOperation calldata userOp, bytes32 /*userOpHash*/) public virtual onlyEntryPoint {
        Address.functionDelegateCall(address(this), userOp.callData[4:]);
    }

    /****************************************************************************************************************
     *                                             Internal mechanisms                                              *
     ****************************************************************************************************************/

    /**
     * @dev Process the signature is valid for this message.
     * @param userOpHash  - Hash of the request that must be signed (includes the entrypoint and chain id)
     * @param signature   - The user's signature
     * @return valid      - Signature is valid
     * @return signer     - Address of the signer that produced the signature
     * @return validAfter - first timestamp this operation is valid
     * @return validUntil - last timestamp this operation is valid. 0 for "indefinite"
     */
    function _processSignature(
        bytes32 userOpHash,
        bytes calldata signature
    ) internal view virtual returns (bool valid, address signer, uint48 validAfter, uint48 validUntil) {
        address recovered = _recoverSigner(userOpHash, signature);
        return (recovered != address(0) && _isAuthorized(recovered), recovered, 0, 0);
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
