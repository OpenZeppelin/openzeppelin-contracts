certoraRun \
    certora/harnesses/ERC721VotesHarness.sol certora/harnesses/GovernorPreventLateQuorumHarness.sol \
    --verify GovernorPreventLateQuorumHarness:certora/specs/GovernorPreventLateQuorum.spec \
    --solc solc \
    --optimistic_loop \
    --loop_iter 3 \
    --cloud \
    --rule $1 \
    --msg "GovernorPreventLateQuorum $1"