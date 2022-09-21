certoraRun \
    certora/harnesses/ERC20VotesHarness.sol \
    --verify ERC20VotesHarness:certora/specs/ERC20Votes.spec \
    --solc solc \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --cloud \
    --msg "ERC20Votes $1" \

    # --disableLocalTypeChecking \
  # --staging "alex/new-dt-hashing-alpha" \
