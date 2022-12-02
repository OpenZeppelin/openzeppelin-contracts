// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Context.sol";
import "../Nonces.sol";
import "./EIP712.sol";
import "./ECDSA.sol";

/**
 * @dev Provides tracking nonces per address and operation. Nonces will only increment.
 */
abstract contract SequentialOperations is Context, EIP712 {
    using Nonces for Nonces.Data;

    mapping(bytes32 => Nonces.Data) private _nonces;

    function operationNonces(bytes32 operationTypehash, address owner) public view virtual returns (uint256) {
        return _nonces[operationTypehash].nonces(owner);
    }

    function useOperationNonce(bytes32 operationTypehash, uint256 nonce) public virtual {
        _useOperationNonce(operationTypehash, _msgSender(), nonce);
    }

    function _validateSequentialOperation(
        bytes32 operationTypehash,
        bytes32 operationHash,
        uint256 nonce,
        bytes memory signature
    ) internal virtual returns(address signer) {
        signer = ECDSA.recover(_hashTypedDataV4(operationHash), signature);
        _useOperationNonce(operationTypehash, signer, nonce);
    }

    function _validateSequentialOperation(
        bytes32 operationTypehash,
        bytes32 operationHash,
        uint256 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal virtual returns(address signer) {
        signer = ECDSA.recover(_hashTypedDataV4(operationHash), v, r, s);
        _useOperationNonce(operationTypehash, signer, nonce);
    }

    function _validateSequentialOperation(
        bytes32 operationTypehash,
        bytes32 operationHash,
        uint256 nonce,
        bytes32 r,
        bytes32 vs
    ) internal virtual returns(address signer) {
        signer = ECDSA.recover(_hashTypedDataV4(operationHash), r, vs);
        _useOperationNonce(operationTypehash, signer, nonce);
    }

    /// @dev Method made non-virtual to deny changing logic of sequential operations invalidation.
    function _useOperationNonce(bytes32 operationTypehash, address owner, uint256 nonce) internal {
        require(nonce == _nonces[operationTypehash].useNonce(owner), "SequentialOperations: invalid nonce");
    }
}
