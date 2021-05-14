// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../utils/cryptography/draft-EIP712.sol";
import "./GovernorCore.sol";

abstract contract Governor is GovernorCore, EIP712 {
    bytes32 private constant _BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    function propose(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    public virtual override returns (uint256 proposalId)
    {
        proposalId = _propose(target, value, data, salt);
        (uint256 snapshot, uint256 deadline,,) = viewProposal(proposalId);
        emit ProposalCreated(proposalId, target, value, data, salt, snapshot, deadline);
        return proposalId;
    }

    function execute(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    public virtual override returns (uint256 proposalId)
    {
        proposalId = _execute(target, value, data, salt);
        emit ProposalExecuted(proposalId);
    }

    function castVote(uint256 proposalId, uint8 support)
    public virtual override
    {
        address voter = _msgSender();
        uint256 balance = _castVote(proposalId, voter, support);
        emit VoteCast(voter, proposalId, support, balance);
    }

    function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s)
    public virtual override
    {
        address voter = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encodePacked(_BALLOT_TYPEHASH, proposalId, support))),
            v, r, s
        );
        uint256 balance = _castVote(proposalId, voter, support);
        emit VoteCast(voter, proposalId, support, balance);
    }
}
