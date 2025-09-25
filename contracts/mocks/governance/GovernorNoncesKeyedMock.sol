// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Governor, Nonces} from "../../governance/Governor.sol";
import {GovernorSettings} from "../../governance/extensions/GovernorSettings.sol";
import {GovernorCountingSimple} from "../../governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotesQuorumFraction} from "../../governance/extensions/GovernorVotesQuorumFraction.sol";
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

    function _validateVoteSig(
        uint256 proposalId,
        uint8 support,
        address voter,
        bytes memory signature
    ) internal virtual override(Governor, GovernorNoncesKeyed) returns (bool) {
        return super._validateVoteSig(proposalId, support, voter, signature);
    }

    function _validateExtendedVoteSig(
        uint256 proposalId,
        uint8 support,
        address voter,
        string memory reason,
        bytes memory params,
        bytes memory signature
    ) internal virtual override(Governor, GovernorNoncesKeyed) returns (bool) {
        return super._validateExtendedVoteSig(proposalId, support, voter, reason, params, signature);
    }

    function _useCheckedNonce(address owner, uint256 nonce) internal virtual override(Nonces, GovernorNoncesKeyed) {
        super._useCheckedNonce(owner, nonce);
    }
}
