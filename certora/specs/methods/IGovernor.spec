// includes some non standard (from extension) and harness functions
methods {
    name()                                            returns string  envfree
    version()                                         returns string  envfree
    token()                                           returns address envfree
    timelock()                                        returns address envfree
    clock()                                           returns uint48
    CLOCK_MODE()                                      returns string
    COUNTING_MODE()                                   returns string  envfree
    hashProposal(address[],uint256[],bytes[],bytes32) returns uint256 envfree
    state(uint256)                                    returns uint8
    proposalThreshold()                               returns uint256 envfree
    proposalSnapshot(uint256)                         returns uint256 envfree
    proposalDeadline(uint256)                         returns uint256 envfree
    votingDelay()                                     returns uint256 envfree
    votingPeriod()                                    returns uint256 envfree
    quorum(uint256)                                   returns uint256 envfree
    getVotes(address,uint256)                         returns uint256 envfree
    getVotesWithParams(address,uint256,bytes)         returns uint256 envfree
    hasVoted(uint256,address)                         returns bool    envfree
    quorumNumerator()                                 returns uint256 envfree
    quorumNumerator(uint256)                          returns uint256 envfree
    quorumDenominator()                               returns uint256 envfree

    propose(address[],uint256[],bytes[],string)                                        returns uint256
    execute(address[],uint256[],bytes[],bytes32)                                       returns uint256
    queue(address[], uint256[], bytes[], bytes32)                                      returns uint256
    cancel(address[],uint256[],bytes[],bytes32)                                        returns uint256
    castVote(uint256,uint8)                                                            returns uint256
    castVoteWithReason(uint256,uint8,string)                                           returns uint256
    castVoteWithReasonAndParams(uint256,uint8,string,bytes)                            returns uint256
    castVoteBySig(uint256,uint8,uint8,bytes32,bytes32)                                 returns uint256
    castVoteWithReasonAndParamsBySig(uint256,uint8,string,bytes,uint8,bytes32,bytes32) returns uint256
    updateQuorumNumerator(uint256)
    updateTimelock(address)

    // harness
    token_getPastTotalSupply(uint256)   returns uint256 envfree
    token_getPastVotes(address,uint256) returns uint256 envfree
    token_clock()                       returns uint48
    token_CLOCK_MODE()                  returns string
    getExecutor()                       returns address envfree
    proposalProposer(uint256)           returns address envfree
    quorumReached(uint256)              returns bool    envfree
    voteSucceeded(uint256)              returns bool    envfree
    isExecuted(uint256)                 returns bool    envfree
    isCanceled(uint256)                 returns bool    envfree
    isQueued(uint256)                   returns bool    envfree
    governanceCallLength()              returns uint256 envfree
    getAgainstVotes(uint256)            returns uint256 envfree
    getForVotes(uint256)                returns uint256 envfree
    getAbstainVotes(uint256)            returns uint256 envfree
    quorumNumeratorLength()             returns uint256 envfree
}
