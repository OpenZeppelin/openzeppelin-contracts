// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IAccountExecute, IEntryPoint} from "../../interfaces/IERC4337.sol";
import {ERC4337Utils} from "./../utils/ERC4337Utils.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";
import {Address} from "../../utils/Address.sol";

abstract contract Account is IAccount, IAccountExecute {
    error AccountEntryPointRestricted();

    IEntryPoint private immutable _entryPoint;

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

    constructor(IEntryPoint entryPoint_) {
        _entryPoint = entryPoint_;
    }

    function entryPoint() public view virtual returns (IEntryPoint) {
        return _entryPoint;
    }

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
    ) public virtual onlyEntryPoint returns (uint256) {
        (, uint256 validationData) = _validateUserOp(userOp, userOpHash, userOp.signature);
        _payPrefund(missingAccountFunds);
        return validationData;
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
     * @param userOp          - The user operation
     * @param userOpHash      - Hash of the user operation (includes the entrypoint and chain id)
     * @return signer         - identifier of the signer (if applicable)
     * @return validationData - validation details as defined in ERC4337
     */
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        bytes calldata userOpSignature
    ) internal virtual returns (address signer, uint256 validationData);

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
