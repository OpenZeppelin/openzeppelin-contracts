certoraRun \
    certora/harnesses/ERC721VotesHarness.sol \
    certora/munged/utils/Checkpoints.sol \
    --verify ERC721VotesHarness:certora/specs/ERC721Votes.spec \
    --solc solc \
    --disableLocalTypeChecking \
    --optimistic_loop \
    --settings -copyLoopUnroll=4 \
    --cloud \
    --msg "ERC721Votes"

    # --staging "alex/new-dt-hashing-alpha" \
