// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Ownable} from "./Ownable.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * This extension of the {Ownable} includes a signature protected ownership transfer mechanism,
 * where the `newOwner` must provide a signature in order to replace the old one.
 * This can help prevent common mistakes, such as transfers of ownership to incorrect accounts,
 * and improve the safety of a `newOwner` wallet, as it can stay offline at a time.
 * Function `transferOwnership` provides a safe way of making an ownership transfer to contracts as well.
 *
 * The initial owner is specified at deployment time in the constructor for `Ownable`. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available all functions
 * from parent (Ownable).
 */
abstract contract OwnableRecipientSignOff is Ownable, EIP712 {
    /**
     * @dev Nonce used for signatures.
     */
    uint256 private _nonce;

    bytes32 private constant TRANSFER_OWNERSHIP_TYPEHASH =
        keccak256("TransferOwnership(uint256 nonce,uint256 deadline)");

    /**
     * @dev Permit deadline has expired.
     */
    error ExpiredSignature(uint256 deadline);

    /**
     * @dev Mismatched signature.
     */
    error InvalidSigner();

    constructor(string memory name) EIP712(name, "1") {}

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     * Requires a `newOwner` account's signature.
     */
    function transferOwnership(address newOwner, uint256 deadline, bytes memory signature) public virtual onlyOwner {
        if (block.timestamp > deadline) {
            revert ExpiredSignature(deadline);
        }
        if (
            !SignatureChecker.isValidSignatureNow(
                newOwner,
                _hashTypedDataV4(keccak256(abi.encode(TRANSFER_OWNERSHIP_TYPEHASH, _useNonce(), deadline))),
                signature
            )
        ) {
            revert InvalidSigner();
        }
        super._transferOwnership(newOwner);
    }

    /**
     * @dev Consumes a nonce.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce() internal virtual returns (uint256) {
        // Flow guarantees that the nonce never overflows.
        unchecked {
            // It is important to do x++ and not ++x here.
            return _nonce++;
        }
    }

    /**
     * @dev Returns the next unused nonce.
     */
    function nonce() public view virtual returns (uint256) {
        return _nonce;
    }
}
