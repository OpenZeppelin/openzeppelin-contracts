// contracts/MyERC7579DelayedSocialRecovery.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {EIP712} from "../../../../utils/cryptography/EIP712.sol";
import {ERC7579Executor} from "../../../../account/modules/ERC7579Executor.sol";
import {ERC7579Validator} from "../../../../account/modules/ERC7579Validator.sol";
import {Calldata} from "../../../../utils/Calldata.sol";
import {ERC7579DelayedExecutor} from "../../../../account/modules/ERC7579DelayedExecutor.sol";
import {ERC7579Multisig} from "../../../../account/modules/ERC7579Multisig.sol";

abstract contract MyERC7579DelayedSocialRecovery is EIP712, ERC7579DelayedExecutor, ERC7579Multisig {
    bytes32 private constant RECOVER_TYPEHASH =
        keccak256("Recover(address account,bytes32 salt,bytes32 mode,bytes executionCalldata)");

    function isModuleType(uint256 moduleTypeId) public pure override(ERC7579Executor, ERC7579Validator) returns (bool) {
        return ERC7579Executor.isModuleType(moduleTypeId) || ERC7579Executor.isModuleType(moduleTypeId);
    }

    // Data encoding: [uint16(executorArgsLength), executorArgs, uint16(multisigArgsLength), multisigArgs]
    function onInstall(bytes calldata data) public override(ERC7579DelayedExecutor, ERC7579Multisig) {
        uint16 executorArgsLength = uint16(bytes2(data[0:2])); // First 2 bytes are the length
        bytes calldata executorArgs = data[2:2 + executorArgsLength]; // Next bytes are the args
        uint16 multisigArgsLength = uint16(bytes2(data[2 + executorArgsLength:4 + executorArgsLength])); // Next 2 bytes are the length
        bytes calldata multisigArgs = data[4 + executorArgsLength:4 + executorArgsLength + multisigArgsLength]; // Next bytes are the args

        ERC7579DelayedExecutor.onInstall(executorArgs);
        ERC7579Multisig.onInstall(multisigArgs);
    }

    function onUninstall(bytes calldata) public override(ERC7579DelayedExecutor, ERC7579Multisig) {
        ERC7579DelayedExecutor.onUninstall(Calldata.emptyBytes());
        ERC7579Multisig.onUninstall(Calldata.emptyBytes());
    }

    // Data encoding: [uint16(executionCalldataLength), executionCalldata, signature]
    function _validateSchedule(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata data
    ) internal view override {
        uint16 executionCalldataLength = uint16(bytes2(data[0:2])); // First 2 bytes are the length
        bytes calldata executionCalldata = data[2:2 + executionCalldataLength]; // Next bytes are the calldata
        bytes calldata signature = data[2 + executionCalldataLength:]; // Remaining bytes are the signature
        require(_rawERC7579Validation(account, _getExecuteTypeHash(account, salt, mode, executionCalldata), signature));
    }

    function _getExecuteTypeHash(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(RECOVER_TYPEHASH, account, salt, mode, executionCalldata)));
    }
}
