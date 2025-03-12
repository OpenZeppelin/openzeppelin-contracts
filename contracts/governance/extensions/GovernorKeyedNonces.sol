// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";
import {Nonces} from "../../utils/Nonces.sol";
import {NoncesKeyed} from "../../utils/NoncesKeyed.sol";
import {SignatureChecker} from "../../utils/cryptography/SignatureChecker.sol";

abstract contract GovernorKeyedNonces is Governor, NoncesKeyed {
    function _useCheckedNonce(address owner, uint256 nonce) internal virtual override(Nonces, NoncesKeyed) {
        super._useCheckedNonce(owner, nonce);
    }

    function _validateVoteSignature(
        address voter,
        uint256 proposalId,
        bytes memory signature,
        bytes memory rawSignatureDigestData,
        uint256 noncePositionOffset
    ) internal virtual override returns (bool) {
        if (super._validateVoteSignature(voter, proposalId, signature, rawSignatureDigestData, noncePositionOffset)) {
            return true;
        }

        // uint192 is sufficient entropy for proposalId within nonce keys.
        uint256 keyedNonce = nonces(voter, uint192(proposalId));
        assembly ("memory-safe") {
            mstore(add(rawSignatureDigestData, noncePositionOffset), keyedNonce)
        }

        if (
            SignatureChecker.isValidSignatureNow(voter, _hashTypedDataV4(keccak256(rawSignatureDigestData)), signature)
        ) {
            _useNonce(voter, uint192(proposalId));
            return true;
        }

        return false;
    }
}
