// Governor.sol base definitions
methods {
    proposalSnapshot(uint256) returns uint256 envfree // matches proposalVoteStart
    hashProposal(address[],uint256[],bytes[],bytes32) returns uint256 envfree

    // internal functions made public in harness:
    _quorumReached(uint256) returns bool envfree
    _voteSucceeded(uint256) returns bool envfree
}

ghost proposalVoteStart(uint256) returns uint64 {
    init_state axiom forall uint256 pId. proposalVoteStart(pId) == 0;
}
ghost proposalVoteEnd(uint256) returns uint64 {
    init_state axiom forall uint256 pId. proposalVoteEnd(pId) == 0;
}
ghost proposalExecuted(uint256) returns bool {
    init_state axiom forall uint256 pId. !proposalExecuted(pId);
}
ghost proposalCanceled(uint256) returns bool {
    init_state axiom forall uint256 pId. !proposalCanceled(pId);
}

hook Sstore _proposals[KEY uint256 pId].voteStart._deadline uint64 newValue STORAGE {
    havoc proposalVoteStart assuming (
        proposalVoteStart@new(pId) == newValue
        && (forall uint256 pId2. pId != pId2 => proposalVoteStart@new(pId2) == proposalVoteStart@old(pId2))
    );
}

hook Sload uint64 value _proposals[KEY uint256 pId].voteStart._deadline STORAGE {
    require proposalVoteStart(pId) == value;
}

hook Sstore _proposals[KEY uint256 pId].voteEnd._deadline uint64 newValue STORAGE {
    havoc proposalVoteEnd assuming (
        proposalVoteEnd@new(pId) == newValue
        && (forall uint256 pId2. pId != pId2 => proposalVoteEnd@new(pId2) == proposalVoteEnd@old(pId2))
    );
}

hook Sload uint64 value _proposals[KEY uint256 pId].voteEnd._deadline STORAGE {
    require proposalVoteEnd(pId) == value;
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////// SANITY CHECKS ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//

rule sanityCheckVoteStart(method f, uint256 pId) {
    uint64 preGhost = proposalVoteStart(pId);
    uint256 pre = proposalSnapshot(pId);

    env e;
    calldataarg arg;
    f(e, arg);

    uint64 postGhost = proposalVoteStart(pId);
    uint256 post = proposalSnapshot(pId);

    assert preGhost == postGhost <=> pre == post, "ghost changes are correlated with getter changes";
    assert pre == preGhost => post == postGhost, "if correlated at the beginning should be correlated at the end";
}

rule sanityCheckVoteEnd(method f, uint256 pId) {
    uint64 preGhost = proposalVoteEnd(pId);
    uint256 pre = proposalSnapshot(pId);

    env e;
    calldataarg arg;
    f(e, arg);

    uint64 postGhost = proposalVoteEnd(pId);
    uint256 post = proposalSnapshot(pId);

    assert preGhost == postGhost <=> pre == post, "ghost changes are correlated with getter changes";
    assert pre == preGhost => post == postGhost, "if correlated at the beginning should be correlated at the end";
}

//////////////////////////////////////////////////////////////////////////////
////////////////////////////// INVARIANTS ////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//

/**
 * A proposal cannot end unless it started.
 */
invariant voteStartBeforeVoteEnd(uint256 pId) proposalVoteStart(pId) < proposalVoteEnd(pId)

/**
 * A proposal cannot be both executed and canceled.
 */
invariant noBothExecutedAndCanceled(uint256 pId) !proposalExecuted(pId) || !proposalCanceled(pId)

/**
 * A proposal cannot be executed nor canceled before it starts
 */
invariant noExecuteOrCancelBeforeStarting(env e, uint256 pId) e.block.timestamp < proposalVoteStart(pId) => !proposalExecuted(pId) && !proposalCanceled(pId)

/**
 * The voting must start not before the proposal’s creation time
 */
rule noStartBeforeCreation(uint256 pId) {
    uint previousStart = proposalVoteStart(pId);
    require previousStart == 0;
    env e;
    calldataarg arg;
    propose(e, arg);

    uint newStart = proposalVoteStart(pId);
    // if created, start is after creation
    assert newStart != 0 => newStart > e.block.timestamp;
}

/**
 * Check hashProposal hashing is reliable (different inputs lead to different buffers hashed)
 */
rule checkHashProposal {
    address[] t1;
    address[] t2;
    uint256[] v1;
    uint256[] v2;
    bytes[] c1;
    bytes[] c2;
    bytes32 d1;
    bytes32 d2;

    uint256 h1 = hashProposal(t1,v1,c1,d1);
    uint256 h2 = hashProposal(t2,v2,c2,d2);
    bool equalHashes = h1 == h2;
    assert equalHashes => t1.length == t2.length;
    assert equalHashes => v1.length == v2.length;
    assert equalHashes => c1.length == c2.length;
    assert equalHashes => d1 == d2;
}

/**
 * A proposal could be executed only if quorum was reached and vote succeeded
 */
invariant executionOnlyIfQuoromReachedAndVoteSucceeded(uint256 pId) proposalExecuted(pId) => _quorumReached(pId) && _voteSucceeded(pId)

/**
 * Once a proposal is created, voteStart and voteEnd are immutable
 */
rule immutableFieldsAfterProposalCreation(uint256 pId, method f) {
    uint _voteStart = proposalVoteStart(pId);
    uint _voteEnd = proposalVoteEnd(pId);
    require _voteStart > 0; // proposal was created

    env e;
    calldataarg arg;
    f(e, arg);

    uint voteStart_ = proposalVoteStart(pId);
    uint voteEnd_ = proposalVoteEnd(pId);
    assert _voteStart == voteStart_;
    assert _voteEnd == voteEnd_;
}