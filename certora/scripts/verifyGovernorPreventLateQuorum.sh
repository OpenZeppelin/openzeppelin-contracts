certoraRun \
    certora/harnesses/ERC721VotesHarness.sol certora/munged/governance/TimelockController.sol certora/harnesses/GovernorPreventLateQuorumHarness.sol \
    --verify GovernorPreventLateQuorumHarness:certora/specs/GovernorCountingSimple.spec \
    --solc solc \
    --optimistic_loop \
    --loop_iter 1 \
    --staging \
    --rule_sanity advanced \
    --send_only \
    --rule $1 \
    --msg "$1" \



