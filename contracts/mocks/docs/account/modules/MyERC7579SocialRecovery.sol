// contracts/MyERC7579SocialRecovery.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Nonces} from "../../../../utils/Nonces.sol";
import {EIP712} from "../../../../utils/cryptography/EIP712.sol";
import {ERC7579Executor} from "../../../../account/modules/ERC7579Executor.sol";
import {ERC7579Validator} from "../../../../account/modules/ERC7579Validator.sol";
import {ERC7579Multisig} from "../../../../account/modules/ERC7579Multisig.sol";

abstract contract MyERC7579SocialRecovery is EIP712, ERC7579Executor, ERC7579Multisig, Nonces {
    bytes32 private constant RECOVER_TYPEHASH =
        keccak256("Recover(address account,bytes32 salt,uint256 nonce,bytes32 mode,bytes executionCalldata)");

    function isModuleType(uint256 moduleTypeId) public pure override(ERC7579Executor, ERC7579Validator) returns (bool) {
        return ERC7579Executor.isModuleType(moduleTypeId) || ERC7579Executor.isModuleType(moduleTypeId);
    }

    // Data encoding: [uint16(executionCalldataLength), executionCalldata, signature]
    function _validateExecution(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata data
    ) internal override returns (bytes calldata) {
        uint16 executionCalldataLength = uint16(bytes2(data[0:2])); // First 2 bytes are the length
        bytes calldata executionCalldata = data[2:2 + executionCalldataLength]; // Next bytes are the calldata
        bytes calldata signature = data[2 + executionCalldataLength:]; // Remaining bytes are the signature
        require(_rawERC7579Validation(account, _getExecuteTypeHash(account, salt, mode, executionCalldata), signature));
        return executionCalldata;
    }

    function _getExecuteTypeHash(
        address account,
        bytes32 salt,
        bytes32 mode,
        bytes calldata executionCalldata
    ) internal returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(abi.encode(RECOVER_TYPEHASH, account, salt, _useNonce(account), mode, executionCalldata))
            );
    }
}
