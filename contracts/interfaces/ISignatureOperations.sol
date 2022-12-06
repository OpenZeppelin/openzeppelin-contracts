// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Provides tracking nonces per address and operation. Nonces will only increment.
 */
interface ISignatureOperations {
    /// @dev Returns next nonce for the signer in the context of the operation typehash and operation beneficiary
    /// @param typehash The operation typehash
    /// @param signer The signer address
    function operationNonces(bytes32 typehash, address signer) external view returns (uint256);

    /// @dev Returns next id for the signer in the context of the operation typehash and operation beneficiary
    /// @param typehash The operation typehash
    /// @param signer The signer address
    /// @param beneficiary The address of the spender, delegate, or other beneficiary of the transaction
    function operationIds(bytes32 typehash, address signer, address beneficiary) external view returns (uint256);

    /// @dev Increments nonce for the caller in the context of the operation typehash and operation beneficiary
    /// @param typehash The operation typehash
    /// @param nonce The operation nonce
    function useOperationNonce(bytes32 typehash, uint256 nonce) external;

    /// @dev Increments id for the caller in the context of the operation typehash and operation beneficiary
    /// @param typehash The operation typehash
    /// @param beneficiary The address of the spender, delegate, or other beneficiary of the transaction
    /// @param id The operation nonce
    function useOperationIds(bytes32 typehash, address beneficiary, uint256 id) external;
}
