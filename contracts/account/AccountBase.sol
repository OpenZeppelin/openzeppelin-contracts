// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IAccount, IEntryPoint, IAccountExecute} from "../interfaces/IERC4337.sol";
import {Address} from "../utils/Address.sol";

abstract contract AccountBase is IAccount, IAccountExecute {
    error AccountEntryPointRestricted();

    modifier onlyEntryPointOrSelf() {
        _checkEntryPointOrSelf();
        _;
    }

    modifier onlyEntryPoint() {
        _checkEntryPoint();
        _;
    }

    function entryPoint() public view virtual returns (IEntryPoint) {
        return IEntryPoint(0x0000000071727De22E5E9d8BAf0edAc6f37da032);
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
        uint256 validationData = _validateUserOp(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
        return validationData;
    }

    /// @inheritdoc IAccountExecute
    function executeUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /*userOpHash*/
    ) public virtual onlyEntryPointOrSelf {
        (address target, uint256 value, bytes memory data) = abi.decode(userOp.callData[4:], (address, uint256, bytes));
        Address.functionCallWithValue(target, data, value);
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual returns (uint256 validationData);

    function _payPrefund(uint256 missingAccountFunds) internal virtual {
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            success;
            //ignore failure (its EntryPoint's job to verify, not account.)
        }
    }

    function _checkEntryPoint() internal view virtual {
        if (msg.sender != address(entryPoint())) {
            revert AccountEntryPointRestricted();
        }
    }

    function _checkEntryPointOrSelf() internal view virtual {
        if (msg.sender != address(this) && msg.sender != address(entryPoint())) {
            revert AccountEntryPointRestricted();
        }
    }

    /// @dev Receive Ether.
    receive() external payable virtual {}
}
