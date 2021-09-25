// Governor.sol base definitions
methods {
    proposalSnapshot(uint256) returns uint256 envfree // matches proposalVoteStart
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

hook Sstore _proposals[KEY uint256 pId] uint64 newValue STORAGE {
    havoc proposalVoteStart assuming (
        proposalVoteStart@new(pId) == newValue & (max_uint64-1)
        && (forall uint256 pId2. pId != pId2 => proposalVoteStart@new(pId2) == proposalVoteStart@old(pId2))
    );
}

hook Sload uint64 value _proposals[KEY uint256 pId] STORAGE {
    require proposalVoteStart(pId) == value & (max_uint64-1);
}


hook Sstore _proposals[KEY uint256 pId].(offset 32).(offset 0) uint64 newValue STORAGE {
    havoc proposalVoteEnd assuming (
        proposalVoteEnd@new(pId) == newValue & (max_uint64-1)
        && (forall uint256 pId2. pId != pId2 => proposalVoteEnd@new(pId2) == proposalVoteEnd@old(pId2))
    );
}

hook Sload uint64 value _proposals[KEY uint256 pId].(offset 32).(offset 0) STORAGE {
    require proposalVoteEnd(pId) == value & (max_uint64-1);
}

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

/**
 * A proposal cannot end unless it started.
 */
invariant voteStartBeforeVoteEnd(uint256 pId) proposalVoteStart(pId) < proposalVoteEnd(pId)

/**
 * A proposal cannot be both executed and canceled.
 */
invariant noBothExecutedAndCanceled(uint256 pId) !proposalExecuted(pId) || !proposalCanceled(pId)