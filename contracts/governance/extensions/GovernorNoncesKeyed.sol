// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";
import {Nonces} from "../../utils/Nonces.sol";
import {NoncesKeyed} from "../../utils/NoncesKeyed.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";

/**
 * @dev An extension of {Governor} that extends existing nonce management to use {NoncesKeyed}, where the key is the first 192 bits of the `proposalId`.
 * This is useful for voting by signature while maintaining separate sequences of nonces for each proposal.
 *
 * NOTE: Traditional (un-keyed) nonces are still supported and can continue to be used as if this extension was not present.
 */
abstract contract GovernorNoncesKeyed is Governor, NoncesKeyed {
    function _useCheckedNonce(address owner, uint256 nonce) internal virtual override(Nonces, NoncesKeyed) {
        super._useCheckedNonce(owner, nonce);
    }

    /**
     * @dev Check the signature against keyed nonce and falls back to the traditional nonce.
     *
     * NOTE: The function skips calling `super._validateVoteSig` if the keyed nonce is valid.
     * Consider side effects might be missed depending in the linearization of the function.
     */
    function _validateVoteSig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature
    ) internal virtual override returns (bool) {
        bool valid = SignatureChecker.isValidSignatureNow(
            voter,
            _hashTypedDataV4(
                keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support, voter, nonces(voter, uint192(proposalId))))
            ),
            signature
        );
        if (valid) _useNonce(voter, uint192(proposalId));
        else valid = super._validateVoteSig(proposalId, support, voter, signature);
        return valid;
    }

    /**
     * @dev Check the signature against keyed nonce and falls back to the traditional nonce.
     *
     * NOTE: The function skips calling `super._validateVoteSig` if the keyed nonce is valid.
     * Consider side effects might be missed depending in the linearization of the function.
     */
    function _validateExtendedVoteSig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string memory reason,
        bytes memory params,
        bytes memory signature
    ) internal virtual override returns (bool) {
        bytes32 structHash = keccak256(
            abi.encode(
                EXTENDED_BALLOT_TYPEHASH,
                proposalId,
                support,
                voter,
                nonces(voter, uint192(proposalId)),
                keccak256(bytes(reason)),
                keccak256(params)
            )
        );
        bool valid = SignatureChecker.isValidSignatureNow(voter, _hashTypedDataV4(structHash), signature);
        if (valid) _useNonce(voter, uint192(proposalId));
        else valid = super._validateExtendedVoteSig(proposalId, support, voter, reason, params, signature);
        return valid;
    }
}
