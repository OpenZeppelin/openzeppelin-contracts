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

    /// @dev Check the signature against the traditional nonce and then the keyed nonce.
    function _validateVoteSignature(
        address voter,
        uint256 proposalId,
        bytes memory signature,
        bytes memory digestPreimage,
        uint256 noncePositionOffset
    ) internal virtual override returns (bool) {
        if (super._validateVoteSignature(voter, proposalId, signature, digestPreimage, noncePositionOffset)) {
            return true;
        }

        // uint192 is sufficient entropy for proposalId within nonce keys.
        uint256 keyedNonce = nonces(voter, uint192(proposalId));
        assembly ("memory-safe") {
            mstore(add(digestPreimage, noncePositionOffset), keyedNonce)
        }

        if (SignatureChecker.isValidSignatureNow(voter, _hashTypedDataV4(keccak256(digestPreimage)), signature)) {
            _useNonce(voter, uint192(proposalId));
            return true;
        }

        return false;
    }
}
