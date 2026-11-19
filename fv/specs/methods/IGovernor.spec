// includes some non standard (from extension) and harness functions
methods {
    function name()                                            external returns (string)  envfree;
    function version()                                         external returns (string)  envfree;
    function token()                                           external returns (address) envfree;
    function timelock()                                        external returns (address) envfree;
    function clock()                                           external returns (uint48);
    function CLOCK_MODE()                                      external returns (string);
    function COUNTING_MODE()                                   external returns (string)  envfree;
    function hashProposal(address[],uint256[],bytes[],bytes32) external returns (uint256) envfree;
    function state(uint256)                                    external returns (IGovernor.ProposalState);
    function proposalThreshold()                               external returns (uint256) envfree;
    function proposalSnapshot(uint256)                         external returns (uint256) envfree;
    function proposalDeadline(uint256)                         external returns (uint256) envfree;
    function proposalProposer(uint256)                         external returns (address) envfree;
    function proposalEta(uint256)                              external returns (uint256) envfree;
    function votingDelay()                                     external returns (uint256) envfree;
    function votingPeriod()                                    external returns (uint256) envfree;
    function quorum(uint256)                                   external returns (uint256);
    function getVotes(address,uint256)                         external returns (uint256);
    function getVotesWithParams(address,uint256,bytes)         external returns (uint256);
    function hasVoted(uint256,address)                         external returns (bool)    envfree;
    function quorumNumerator()                                 external returns (uint256) envfree;
    function quorumNumerator(uint256)                          external returns (uint256) envfree;
    function quorumDenominator()                               external returns (uint256) envfree;

    function propose(address[],uint256[],bytes[],string)                                    external returns (uint256);
    function execute(address[],uint256[],bytes[],bytes32)                                   external returns (uint256);
    function queue(address[],uint256[],bytes[],bytes32)                                     external returns (uint256);
    function cancel(address[],uint256[],bytes[],bytes32)                                    external returns (uint256);
    function castVote(uint256,uint8)                                                        external returns (uint256);
    function castVoteWithReason(uint256,uint8,string)                                       external returns (uint256);
    function castVoteWithReasonAndParams(uint256,uint8,string,bytes)                        external returns (uint256);
    function castVoteBySig(uint256,uint8,address,bytes)                                     external returns (uint256);
    function castVoteWithReasonAndParamsBySig(uint256,uint8,address,string,bytes,bytes)     external returns (uint256);
    function updateQuorumNumerator(uint256)                                                 external;
    function updateTimelock(address)                                                        external;

    // harness
    function token_getPastTotalSupply(uint256)                external returns (uint256);
    function token_getPastVotes(address,uint256)              external returns (uint256);
    function token_clock()                                    external returns (uint48);
    function token_CLOCK_MODE()                               external returns (string);
    function hashProposal(address[],uint256[],bytes[],string) external returns (uint256) envfree;
    function safeState(uint256)                               external returns (uint8);
    function hasTimelockProposerRole()                        external returns (bool)    envfree;
    function isTimelockOperation(address[],uint256[],bytes[],bytes32) external returns (bool) envfree;
    function timelockMinDelay()                               external returns (uint256) envfree;
    function getExecutor()                                    external returns (address) envfree;
    function quorumReached(uint256)                           external returns (bool);
    function voteSucceeded(uint256)                           external returns (bool)    envfree;
    function isExecuted(uint256)                              external returns (bool)    envfree;
    function isCanceled(uint256)                              external returns (bool)    envfree;
    function isQueued(uint256)                                external returns (bool)    envfree;
    function governanceCallLength()                           external returns (uint256) envfree;
    function getAgainstVotes(uint256)                         external returns (uint256) envfree;
    function getForVotes(uint256)                             external returns (uint256) envfree;
    function getAbstainVotes(uint256)                         external returns (uint256) envfree;
    function quorumNumeratorLength()                          external returns (uint256) envfree;
    function timelockId(uint256)                              external returns (bytes32) envfree;
}
