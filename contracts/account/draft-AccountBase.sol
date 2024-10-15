// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IEntryPoint, IAccountExecute} from "../interfaces/draft-IERC4337.sol";
import {Address} from "../utils/Address.sol";

/**
 * @dev A simple ERC4337 account implementation.
 *
 * This base implementation only includes the minimal logic to process user operations.
 * Developers must implement the {_validateUserOp} function to define the account's validation logic.
 */
abstract contract AccountBase is IAccount, IAccountExecute {
    /**
     * @dev Unauthorized call to the account.
     */
    error AccountUnauthorized(address sender);

    /**
     * @dev Revert if the caller is not the entry point or the account itself.
     */
    modifier onlyEntryPointOrSelf() {
        _checkEntryPointOrSelf();
        _;
    }

    /**
     * @dev Revert if the caller is not the entry point.
     */
    modifier onlyEntryPoint() {
        _checkEntryPoint();
        _;
    }

    /**
     * @dev Canonical entry point for the account that forwards and validates user operations.
     */
    function entryPoint() public view virtual returns (IEntryPoint) {
        return IEntryPoint(0x0000000071727De22E5E9d8BAf0edAc6f37da032);
    }

    /**
     * @dev Return the account nonce for the canonical sequence.
     */
    function getNonce() public view virtual returns (uint256) {
        return getNonce(0);
    }

    /**
     * @dev Return the account nonce for a given sequence (key).
     */
    function getNonce(uint192 key) public view virtual returns (uint256) {
        return entryPoint().getNonce(address(this), key);
    }

    /**
     * @inheritdoc IAccount
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) public virtual onlyEntryPoint returns (uint256) {
        uint256 validationData = _validateUserOp(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
        return validationData;
    }

    /**
     * @inheritdoc IAccountExecute
     */
    function executeUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /*userOpHash*/
    ) public virtual onlyEntryPointOrSelf {
        (address target, uint256 value, bytes memory data) = abi.decode(userOp.callData[4:], (address, uint256, bytes));
        Address.functionCallWithValue(target, data, value);
    }

    /**
     * @dev Validation logic for {validateUserOp}.
     *
     * IMPORTANT: Implementing a mechanism to validate user operations is a security-sensitive operation
     * as it may allow an attacker to bypass the account's security measures. Check out {AccountECDSA},
     * {AccountP256}, or {AccountRSA} for digital signature validation implementations.
     */
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual returns (uint256 validationData);

    /**
     * @dev Sends the missing funds for executing the user operation to the {entrypoint}.
     * The `missingAccountFunds` must be defined by the entrypoint when calling {validateUserOp}.
     */
    function _payPrefund(uint256 missingAccountFunds) internal virtual {
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            success; // Silence warning. The entrypoint should validate the result.
        }
    }

    /**
     * @dev Ensures the caller is the {entrypoint}.
     */
    function _checkEntryPoint() internal view virtual {
        address sender = msg.sender;
        if (sender != address(entryPoint())) {
            revert AccountUnauthorized(sender);
        }
    }

    /**
     * @dev Ensures the caller is the {entrypoint} or the account itself.
     */
    function _checkEntryPointOrSelf() internal view virtual {
        address sender = msg.sender;
        if (sender != address(this) && sender != address(entryPoint())) {
            revert AccountUnauthorized(sender);
        }
    }

    /**
     * @dev Receive Ether.
     */
    receive() external payable virtual {}
}
