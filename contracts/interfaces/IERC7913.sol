// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (interfaces/IERC7913.sol)

pragma solidity >=0.5.0;

/**
 * @dev Signature verifier interface.
 */
interface IERC7913SignatureVerifier {
    /**
     * @dev Verifies `signature` as a valid signature of `hash` by `key`.
     *
     * MUST return the bytes4 magic value IERC7913SignatureVerifier.verify.selector if the signature is valid.
     * SHOULD return 0xffffffff or revert if the signature is not valid.
     * SHOULD return 0xffffffff or revert if the key is empty
     */
    function verify(bytes calldata key, bytes32 hash, bytes calldata signature) external view returns (bytes4);
}
