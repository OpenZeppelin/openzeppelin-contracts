// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (governance/extensions/GovernorNoncesKeyed.sol)

pragma solidity ^0.8.24;

import {Governor} from "../Governor.sol";
import {Nonces} from "../../utils/Nonces.sol";
import {NoncesKeyed} from "../../utils/NoncesKeyed.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";

/**
 * @dev An extension of {Governor} that extends existing nonce management to use {NoncesKeyed}, where the key is the low-order 192 bits of the `proposalId`.
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
     * NOTE: This function won't call `super._validateVoteSig` if the keyed nonce is valid.
     * Side effects may be skipped depending on the linearization of the function.
     */
    function _validateVoteSig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature
    ) internal virtual override returns (bool) {
        if (
            SignatureChecker.isValidSignatureNow(
                voter,
                _hashTypedDataV4(
                    keccak256(
                        abi.encode(BALLOT_TYPEHASH, proposalId, support, voter, nonces(voter, uint192(proposalId)))
                    )
                ),
                signature
            )
        ) {
            _useNonce(voter, uint192(proposalId));
            return true;
        } else {
            return super._validateVoteSig(proposalId, support, voter, signature);
        }
    }

    /**
     * @dev Check the signature against keyed nonce and falls back to the traditional nonce.
     *
     * NOTE: This function won't call `super._validateExtendedVoteSig` if the keyed nonce is valid.
     * Side effects may be skipped depending on the linearization of the function.
     */
    function _validateExtendedVoteSig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string memory reason,
        bytes memory params,
        bytes memory signature
    ) internal virtual override returns (bool) {
        if (
            SignatureChecker.isValidSignatureNow(
                voter,
                _hashTypedDataV4(
                    keccak256(
                        abi.encode(
                            EXTENDED_BALLOT_TYPEHASH,
                            proposalId,
                            support,
                            voter,
                            nonces(voter, uint192(proposalId)),
                            keccak256(bytes(reason)),
                            keccak256(params)
                        )
                    )
                ),
                signature
            )
        ) {
            _useNonce(voter, uint192(proposalId));
            return true;
        } else {
            return super._validateExtendedVoteSig(proposalId, support, voter, reason, params, signature);
        }
    }
}
