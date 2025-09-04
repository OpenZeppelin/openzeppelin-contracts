// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {ERC7579Executor} from "../../../account/modules/ERC7579Executor.sol";
import {ERC7579Validator} from "../../../account/modules/ERC7579Validator.sol";
import {ERC7579Multisig} from "../../../account/modules/ERC7579Multisig.sol";
import {ERC7579MultisigWeighted} from "../../../account/modules/ERC7579MultisigWeighted.sol";
import {MODULE_TYPE_EXECUTOR} from "../../../interfaces/draft-IERC7579.sol";

abstract contract ERC7579MultisigExecutorMock is EIP712, ERC7579Executor, ERC7579Multisig {
    bytes32 private constant EXECUTE_OPERATION =
        keccak256("ExecuteOperation(address account,bytes32 mode,bytes executionCalldata,bytes32 salt)");

    function isModuleType(uint256 moduleTypeId) public pure override(ERC7579Executor, ERC7579Validator) returns (bool) {
        return ERC7579Executor.isModuleType(moduleTypeId) || ERC7579Executor.isModuleType(moduleTypeId);
    }

    // Data encoding: [uint16(executionCalldataLength), executionCalldata, signature]
    function _validateExecution(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata data
    ) internal view override returns (bytes calldata) {
        uint16 executionCalldataLength = uint16(bytes2(data[0:2])); // First 2 bytes are the length
        bytes calldata executionCalldata = data[2:2 + executionCalldataLength]; // Next bytes are the calldata
        bytes32 typeHash = _getExecuteTypeHash(account, salt, mode, executionCalldata);
        require(_rawERC7579Validation(account, typeHash, data[2 + executionCalldataLength:])); // Remaining bytes are the signature
        return executionCalldata;
    }

    function _getExecuteTypeHash(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(EXECUTE_OPERATION, account, salt, mode, executionCalldata)));
    }
}

abstract contract ERC7579MultisigWeightedExecutorMock is EIP712, ERC7579Executor, ERC7579MultisigWeighted {
    bytes32 private constant EXECUTE_OPERATION =
        keccak256("ExecuteOperation(address account,bytes32 mode,bytes executionCalldata,bytes32 salt)");

    function isModuleType(uint256 moduleTypeId) public pure override(ERC7579Executor, ERC7579Validator) returns (bool) {
        return ERC7579Executor.isModuleType(moduleTypeId) || ERC7579Executor.isModuleType(moduleTypeId);
    }

    // Data encoding: [uint16(executionCalldataLength), executionCalldata, signature]
    function _validateExecution(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata data
    ) internal view override returns (bytes calldata) {
        uint16 executionCalldataLength = uint16(bytes2(data[0:2])); // First 2 bytes are the length
        bytes calldata executionCalldata = data[2:2 + executionCalldataLength]; // Next bytes are the calldata
        bytes32 typeHash = _getExecuteTypeHash(account, salt, mode, executionCalldata);
        require(_rawERC7579Validation(account, typeHash, data[2 + executionCalldataLength:])); // Remaining bytes are the signature
        return executionCalldata;
    }

    function _getExecuteTypeHash(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata
    ) internal view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(EXECUTE_OPERATION, account, salt, mode, executionCalldata)));
    }
}
