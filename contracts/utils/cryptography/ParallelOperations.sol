// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Context.sol";
import "../Nonces.sol";
import "./EIP712.sol";
import "./ECDSA.sol";

/**
 * @dev Provides tracking nonces per address and operation. Operation ids should be unique.
 */
abstract contract ParallelOperations is Context, EIP712 {
    mapping(bytes32 => mapping(address => mapping(uint256 => bool))) private _usedOperationIds;

    function isOperationIdAvailable(bytes32 operationTypehash, address owner, uint256 operationId) public view virtual returns (bool) {
        return !_usedOperationIds[operationTypehash][owner][operationId];
    }

    function useOperationId(bytes32 operationTypehash, uint256 operationId) public virtual {
        _useOperationId(operationTypehash, _msgSender(), operationId);
    }

    function _validateParallelOperation(
        bytes32 operationTypehash,
        bytes32 operationHash,
        uint256 operationId,
        bytes memory signature
    ) internal virtual returns(address signer) {
        signer = ECDSA.recover(_hashTypedDataV4(operationHash), signature);
        _useOperationId(operationTypehash, signer, operationId);
    }

    function _validateParallelOperation(
        bytes32 operationTypehash,
        bytes32 operationHash,
        uint256 operationId,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal virtual returns(address signer) {
        signer = ECDSA.recover(_hashTypedDataV4(operationHash), v, r, s);
        _useOperationId(operationTypehash, signer, operationId);
    }

    function _validateParallelOperation(
        bytes32 operationTypehash,
        bytes32 operationHash,
        uint256 operationId,
        bytes32 r,
        bytes32 vs
    ) internal virtual returns(address signer) {
        signer = ECDSA.recover(_hashTypedDataV4(operationHash), r, vs);
        _useOperationId(operationTypehash, signer, operationId);
    }

    /// @dev Method made non-virtual to deny changing logic of parallel operations invalidation.
    function _useOperationId(bytes32 operationTypehash, address owner, uint256 operationId) internal {
        require(
            !_usedOperationIds[operationTypehash][owner][operationId],
            "ParallelOperations: invalid operation id"
        );
        _usedOperationIds[operationTypehash][owner][operationId] = true;
    }
}
