// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Governor, Nonces} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorProposalGuardian} from "../../governance/extensions/GovernorProposalGuardian.sol";
import {GovernorNoncesKeyed} from "../../governance/extensions/GovernorNoncesKeyed.sol";

abstract contract GovernorNoncesKeyedMock is
    GovernorSettings,
    GovernorVotesQuorumFraction,
    GovernorCountingSimple,
    GovernorNoncesKeyed
{
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    function _validateVoteSignature(
        address voter,
        uint256 proposalId,
        bytes memory signature,
        bytes memory rawSignatureDigestData,
        uint256 noncePositionOffset
    ) internal virtual override(Governor, GovernorNoncesKeyed) returns (bool) {
        return super._validateVoteSignature(voter, proposalId, signature, rawSignatureDigestData, noncePositionOffset);
    }

    function _useCheckedNonce(address owner, uint256 nonce) internal virtual override(Nonces, GovernorNoncesKeyed) {
        super._useCheckedNonce(owner, nonce);
    }
}
